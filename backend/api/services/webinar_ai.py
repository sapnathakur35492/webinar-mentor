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
# When True, skip OpenAI and use mock concepts (for testing / when quota exhausted)
USE_MOCK_OPENAI = os.getenv("MOCK_OPENAI_MODE", "false").lower() == "true"

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

    def _get_mock_concepts(self) -> List[Concept]:
        """Return mock concepts for fallback when OpenAI fails (429, quota, etc.)"""
        return [
            Concept(
                title="The Change 2.0 Framework",
                big_idea="Automating business transformation using AI",
                hook="Why manual consulting is dead",
                structure_points=["The Old Way", "The AI Shift", "The New Reality"],
                secrets=[
                    {"assumption": "AI is hard", "belief": "AI is easy", "story": "My grandma can do it", "transformation": "Fear to Power"},
                    {"assumption": "Time is fixed", "belief": "Time is elastic", "story": "The 4 hour work week", "transformation": "Burnout to Balance"},
                    {"assumption": "Quality takes time", "belief": "Speed creates quality", "story": "The MVP mindset", "transformation": "Perfectionism to Progress"}
                ],
                mechanism="The Neural Sync Protocol",
                value_anchor={"price": ["1000"], "comparison": ["100 hours of manual work"]},
                bonus_ideas=["AI Toolkit", "Prompt Library"],
                cta_sentence="Join the revolution today",
                promises=["Save 20 hours/week", "Double revenue"]
            ),
            Concept(
                title="Webinar Mastery 2026",
                big_idea="Perfect webinars without the stress",
                hook="The 3-step formula top creators use",
                structure_points=["Hook", "Story", "Offer"],
                secrets=[
                    {"assumption": "Selling is sleazy", "belief": "Selling is serving", "story": "The doctor analogy", "transformation": "Hiding to Helping"},
                    {"assumption": "I need a big audience", "belief": "I need a ready audience", "story": "The 1000 true fans", "transformation": "Broad to Deep"},
                    {"assumption": "Tech is the barrier", "belief": "Message is the barrier", "story": "The ugly funnel that converted", "transformation": "Confused to Clear"}
                ],
                mechanism="The Engagement Loop",
                value_anchor={"price": ["997"], "comparison": ["Hiring a copywriter"]},
                bonus_ideas=["Slide Templates", "Email Scripts"],
                cta_sentence="Start your masterclass now",
                promises=["Convert at 10%", "Build authority"]
            ),
            Concept(
                title="High-Ticket Freedom",
                big_idea="Selling premium services with zero sales calls",
                hook="Stop chasing clients, let them come to you",
                structure_points=["Attraction", "Nurture", "Conversion"],
                secrets=[
                    {"assumption": "Cold calling works", "belief": "Inbound attraction works", "story": "The empty phone", "transformation": "Chasing to Attracting"},
                    {"assumption": "Price is logic", "belief": "Price is emotion", "story": "The luxury brand", "transformation": "Commodity to Premium"},
                    {"assumption": "I need credentials", "belief": "I need results", "story": "The dropout genius", "transformation": "Imposter to Authority"}
                ],
                mechanism="The Authority Beacon",
                value_anchor={"price": ["2500"], "comparison": ["A full sales team"]},
                bonus_ideas=["Sales Scripts", "Objection Handling Guide"],
                cta_sentence="Claim your freedom",
                promises=["Zero cold calls", "High margin clients"]
            )
        ]

    async def generate_content(self, prompt: str) -> str:
        """Call OpenAI API. Raises ValueError on 429/quota/API errors."""
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI API Error (no key): OPENAI_API_KEY not set")
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
            response = requests.post(OPENAI_ENDPOINT, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    return data["choices"][0]["message"]["content"]
                raise ValueError("Unexpected response format from OpenAI")
            elif response.status_code == 429:
                # Explicit 429 handling - quota exceeded or rate limit
                err_msg = response.text[:500] if response.text else "Rate limit / quota exceeded"
                raise ValueError(f"OpenAI 429: {err_msg}")
            else:
                raise ValueError(f"OpenAI API Error ({response.status_code}): {response.text[:500]}")
        except requests.RequestException as e:
            print(f"AI Gen Network Error: {e}")
            raise ValueError(f"OpenAI connection failed: {e}") from e

    async def _apply_mock_concepts_and_return(self, asset: WebinarAsset, reason: str = "API error") -> dict:
        """Apply mock concepts to asset and return response. Used for fallback when OpenAI fails."""
        mock_concepts = self._get_mock_concepts()
        asset.concepts_original = mock_concepts
        asset.concepts_improved = mock_concepts
        asset.concepts_evaluated = f"MOCK EVALUATION ({reason})"
        await asset.save()
        print(f"[WebinarAI] Asset saved with MOCK concepts (reason: {reason})")
        return {
            "original": "MOCK GENERATION - OpenAI quota/API issue. Using demo concepts.",
            "evaluation": "MOCK EVALUATION",
            "improved": "MOCK IMPROVEMENT",
            "concepts_count": len(mock_concepts),
            "mock_fallback": True,
            "mock_reason": reason
        }

    async def generate_concepts_chain(self, asset_id: str) -> dict:
        asset = await WebinarAsset.get(asset_id)
        if not asset:
            raise ValueError("Asset not found")
        
        # MOCK MODE: Skip OpenAI entirely (set MOCK_OPENAI_MODE=true when quota exhausted)
        if USE_MOCK_OPENAI:
            print(f"[WebinarAI] MOCK_OPENAI_MODE enabled - using mock concepts")
            return await self._apply_mock_concepts_and_return(asset, "MOCK_OPENAI_MODE")
        
        print(f"[WebinarAI] Starting concept generation for asset {asset_id}")
        concepts_text = ""
        evaluation_text = ""
        improved_text = ""
        parsed_concepts: List[Concept] = []
        improved_concepts: List[Concept] = []
            
        try:
            # 1. Generate (English)
            prompt_1 = CONCEPT_GENERATION_PROMPT.format(
                onboarding_doc=asset.onboarding_doc_content or "", 
                hook_analysis=asset.hook_analysis_content or ""
            )
            concepts_text = await self.generate_content(prompt_1)
            print(f"[WebinarAI] Got concepts_text: {concepts_text[:200]}...")
            
            parsed_concepts = self._parse_concepts_from_text(concepts_text)
            
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
            
            improved_concepts = self._parse_concepts_from_text(improved_text)
            asset.concepts_improved = improved_concepts
            print(f"[WebinarAI] Parsed {len(improved_concepts)} improved concepts")
            
        except Exception as e:
            err_str = str(e).lower()
            reason = "429 quota" if "429" in err_str or "quota" in err_str else str(e)[:200]
            print(f"[WebinarAI] OpenAI API Error: {e}")
            print(f"[WebinarAI] FALLING BACK TO MOCK CONCEPTS (reason: {reason})")
            return await self._apply_mock_concepts_and_return(asset, reason)
        
        asset.concepts_original = parsed_concepts
        if not asset.concepts_improved:
            asset.concepts_improved = improved_concepts
        await asset.save()
        print(f"[WebinarAI] Asset saved with AI concepts")
        
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
