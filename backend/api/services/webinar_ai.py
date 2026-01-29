import os
import json
import requests
from api.models import WebinarAsset, Concept, Slide, EmailPlan
from api.prompts.concepts import CONCEPT_GENERATION_PROMPT, CONCEPT_EVALUATION_PROMPT, CONCEPT_IMPROVEMENT_PROMPT
from api.prompts.refinement import CONCEPT_TRANSCRIPT_UPDATE_PROMPT, STRUCTURE_TRANSCRIPT_UPDATE_PROMPT
from api.prompts.structure import STRUCTURE_GENERATION_PROMPT, STRUCTURE_EVALUATION_PROMPT, STRUCTURE_IMPROVEMENT_PROMPT
from api.prompts.emails import EMAIL_PLAN_PROMPT, EMAIL_GENERATION_PROMPT, EMAIL_SELF_EVALUATION_PROMPT, EMAIL_EVALUATION_IMPLEMENTATION_PROMPT
# from api.prompts.norwegian_prompts import ... (Commented out)
from beanie import PydanticObjectId
from typing import List, Optional
import base64
import io
from PyPDF2 import PdfReader
from core.settings import settings

# Configuration
OPENAI_API_KEY = settings.OPENAI_API_KEY
OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

class WebinarAIService:
    
    def __init__(self):
        pass

    async def extract_text_from_file(self, file_bytes: bytes, filename: str) -> str:
        try:
            if filename.lower().endswith(".pdf"):
                reader = PdfReader(io.BytesIO(file_bytes))
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            elif filename.lower().endswith(".txt"):
                return file_bytes.decode("utf-8")
            return ""
        except Exception as e:
            print(f"Error extracting text: {e}")
            return ""

    async def create_asset(self, mentor_id: str, onboarding_doc: str, hook_analysis: str, file_bytes: Optional[bytes] = None, filename: Optional[str] = None) -> WebinarAsset:
        if file_bytes and filename:
            extracted = await self.extract_text_from_file(file_bytes, filename)
            if extracted:
                onboarding_doc = f"{onboarding_doc}\n\n[EXTRACTED FROM {filename}]:\n{extracted}"

        asset = WebinarAsset(
            mentor_id=mentor_id,
            onboarding_doc_content=onboarding_doc,
            hook_analysis_content=hook_analysis
        )
        await asset.save()
        return asset

    async def generate_content(self, prompt: str) -> str:
        try:
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a professional webinar content strategist and copywriter."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            
            # Using synchronous requests inside async method is blocking, but for this prototype/script it's acceptable.
            # Ideally use aiohttp, but requests is simpler to verify right now based on the user's curl validaton.
            response = requests.post(OPENAI_ENDPOINT, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                # Standard OpenAI chat completions response format
                if "choices" in data and len(data["choices"]) > 0:
                    extracted_text = data["choices"][0]["message"]["content"]
                    return extracted_text
                else:
                    raise ValueError("Unexpected response format from OpenAI")
            else:
                raise ValueError(f"OpenAI API Error ({response.status_code}): {response.text}")
                
        except Exception as e:
            print(f"AI Gen Error: {e}")
            raise ValueError(f"AI Generation Failed: {e}")

    async def generate_concepts_chain(self, asset_id: str) -> dict:
        asset = await WebinarAsset.get(asset_id)
        if not asset:
            raise ValueError("Asset not found")
        
        print(f"[WebinarAI] Starting concept generation for asset {asset_id}")
            
        # 1. Generate (English)
        prompt_1 = CONCEPT_GENERATION_PROMPT.format(
            onboarding_doc=asset.onboarding_doc_content, 
            hook_analysis=asset.hook_analysis_content
        )
        concepts_text = await self.generate_content(prompt_1)
        print(f"[WebinarAI] Got concepts_text: {concepts_text[:200]}...")
        
        # Parse concepts from AI response (expect JSON array)
        parsed_concepts = self._parse_concepts_from_text(concepts_text)
        asset.concepts_original = parsed_concepts
        print(f"[WebinarAI] Parsed {len(parsed_concepts)} original concepts")
        
        # 2. Evaluate (English)
        prompt_2 = CONCEPT_EVALUATION_PROMPT.format(concepts=concepts_text)
        evaluation_text = await self.generate_content(prompt_2)
        asset.concepts_evaluated = evaluation_text
        print(f"[WebinarAI] Got evaluation")
        
        # 3. Improve (English)
        prompt_3 = CONCEPT_IMPROVEMENT_PROMPT.format(
            concepts=concepts_text,
            evaluation=evaluation_text
        )
        improved_text = await self.generate_content(prompt_3)
        
        # Parse improved concepts
        improved_concepts = self._parse_concepts_from_text(improved_text)
        asset.concepts_improved = improved_concepts
        print(f"[WebinarAI] Parsed {len(improved_concepts)} improved concepts")
        
        await asset.save()
        print(f"[WebinarAI] Asset saved with concepts")
        
        return {
            "original": concepts_text,
            "evaluation": evaluation_text,
            "improved": improved_text,
            "concepts_count": len(improved_concepts) if improved_concepts else len(parsed_concepts)
        }

    def _parse_concepts_from_text(self, text: str) -> List[Concept]:
        """Parse JSON concepts from AI response text."""
        try:
            # Try to extract JSON array from the text
            import re
            
            # Look for JSON array pattern
            json_match = re.search(r'\[\s*\{.*\}\s*\]', text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)
                
                concepts = []
                for item in data:
                    concept = Concept(
                        title=item.get("title", "Untitled Concept"),
                        big_idea=item.get("big_idea", ""),
                        hook=item.get("hook", ""),
                        structure_points=item.get("structure_points", []),
                        secrets=item.get("secrets", []),
                        mechanism=item.get("mechanism", ""),
                        value_anchor=item.get("value_anchor", {}),
                        bonus_ideas=item.get("bonus_ideas", []),
                        cta_sentence=item.get("cta_sentence", ""),
                        promises=item.get("promises", [])
                    )
                    concepts.append(concept)
                return concepts
            
            # Fallback: Create a single concept from raw text
            print("[WebinarAI] No JSON found, creating single concept from raw text")
            return [Concept(
                title="Generated Concept",
                big_idea=text[:500] if len(text) > 500 else text,
                hook="See full concept above",
                structure_points=[],
                secrets=[],
                mechanism="",
                value_anchor={},
                bonus_ideas=[],
                cta_sentence="",
                promises=[]
            )]
            
        except Exception as e:
            print(f"[WebinarAI] Error parsing concepts: {e}")
            # Return empty list on error, don't crash
            return []

    async def update_concept_with_transcript(self, asset_id: str, transcript: str) -> str:
        asset = await WebinarAsset.get(asset_id)
        # Use English Prompt
        prompt = CONCEPT_TRANSCRIPT_UPDATE_PROMPT.format(
            current_concept=asset.concepts_evaluated,
            transcript=transcript
        )
        return await self.generate_content(prompt)
        
    async def generate_structure(self, asset_id: str, concept_text: str) -> str:
        asset = await WebinarAsset.get(asset_id)
        if not asset:
            raise ValueError("Asset not found")
            
        # 1. Generate (English)
        prompt_1 = STRUCTURE_GENERATION_PROMPT.format(concept=concept_text)
        structure_text = await self.generate_content(prompt_1)
        
        # 2. Evaluate (English)
        prompt_2 = STRUCTURE_EVALUATION_PROMPT.format(structure=structure_text)
        evaluation_text = await self.generate_content(prompt_2)
        
        # 3. Improve (English)
        prompt_3 = STRUCTURE_IMPROVEMENT_PROMPT.format(
            structure=structure_text,
            evaluation=evaluation_text
        )
        improved_structure = await self.generate_content(prompt_3)
        
        asset.structure_content = improved_structure
        await asset.save()
        
        return improved_structure

    async def generate_email_plan(self, asset_id: str, structure_text: str, product_details: str) -> str:
        # 1. Generate Plan
        prompt_1 = EMAIL_PLAN_PROMPT.format(
            concept_structure=structure_text,
            product_details=product_details
        )
        plan_text = await self.generate_content(prompt_1)
        
        # 2. Self-Evaluate Plan (Using a generic eval prompt or specific if available, here using Concept eval as template logic for now or raw eval)
        # Note: We didn't add EMAIL_PLAN_EVALUATION_PROMPT explicitly, but we can reuse the logic or skip if not in brief. 
        # Brief says "For each email...", but for the PLAN itself, it's good to checking.
        # Let's stick to the Brief: "AI drafts the email -> AI self-evaluates the email". 
        # But this function generates the PLAN. Detailed email generation is separate.
        # I will return the plan as-is for now, but ensure the Email Generation Loop is ready for individual emails if needed.
        # Actually, let's keep it simple for the Plan to avoid over-engineering if not requested. The prompt itself is very detailed.
        
        return plan_text

    async def generate_single_email_chain(self, email_outline: str, concept_context: str) -> dict:
        """
        Generates a single email with the 3-step loop (Draft -> Eval -> Improve).
        This is the core "Machine Learning" loop for Email Production.
        """
        # 1. Draft
        prompt_1 = EMAIL_GENERATION_PROMPT.format(email_outline=email_outline, concept_context=concept_context)
        print("   -> Drafting Email...")
        draft_text = await self.generate_content(prompt_1)
        
        # 2. Evaluate
        prompt_2 = EMAIL_SELF_EVALUATION_PROMPT.format(email_text=draft_text)
        print("   -> Self-Evaluating Email...")
        evaluation_text = await self.generate_content(prompt_2)
        
        # 3. Improve
        prompt_3 = EMAIL_EVALUATION_IMPLEMENTATION_PROMPT.format(
            email_text=draft_text,
            evaluation=evaluation_text
        )
        print("   -> Improving Email...")
        final_email_text = await self.generate_content(prompt_3)
        
        return {
            "draft": draft_text,
            "evaluation": evaluation_text,
            "final_email": final_email_text
        }

webinar_ai_service = WebinarAIService()
