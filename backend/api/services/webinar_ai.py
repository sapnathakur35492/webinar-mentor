import os
import json
import requests
from api.models import WebinarAsset, Concept, Slide, EmailPlan
from api.prompts.concepts_v2 import (
    CONCEPT_GENERATION_PROMPT, 
    CONCEPT_EVALUATION_PROMPT, 
    CONCEPT_IMPROVEMENT_PROMPT
)
from api.prompts.structure_v2 import (
    STRUCTURE_GENERATION_PROMPT, 
    STRUCTURE_EVALUATION_PROMPT, 
    STRUCTURE_IMPROVEMENT_PROMPT
)
from api.prompts.refinement import CONCEPT_TRANSCRIPT_UPDATE_PROMPT, STRUCTURE_TRANSCRIPT_UPDATE_PROMPT
from api.prompts.emails_v2 import (
    EMAIL_STRATEGY_PROMPT, 
    EMAIL_GENERATION_PROMPT, 
    EMAIL_EVALUATION_PROMPT, 
    EMAIL_IMPROVEMENT_PROMPT
)
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
# USE_MOCK_OPENAI = os.getenv("MOCK_OPENAI_MODE", "false").lower() == "true"
USE_MOCK_OPENAI = True # FORCED for debugging

class WebinarAIService:
    
    def __init__(self):
        print("DEBUG: WebinarAIService Initialized (CHANGE 2.0 STANDARD - ENGLISH V1)")
        pass

    async def extract_text_from_file(self, file_bytes: bytes, filename: str) -> str:
        try:
            if filename.lower().endswith(".pdf"):
                reader = PdfReader(io.BytesIO(file_bytes))
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            elif filename.lower().endswith((".txt", ".srt", ".vtt")):
                return file_bytes.decode("utf-8")
            elif filename.lower().endswith(".docx"):
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                return "\n".join([para.text for para in doc.paragraphs])
            return ""
        except Exception as e:
            print(f"Error extracting text from {filename}: {e}")
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
        """Return professional-grade mock concepts with long-form paragraphs."""
        return [
            Concept(
                title="Den Transformasjonsdrevne Mentoren",
                big_idea="Din unike historie er ikke bare en fortelling; det er din mest kraftfulle salgsmaskin. Ved å transformere dine personlige gjennombrudd til en strategisk rammeverk, kan du tiltrekke deg drømmekunder som ser din verdi før du i det hele tatt åpner munnen. Dette handler om å slutte å selge timer, og begynne å selge transformasjon gjennom et psykologisk strukturert budskap som resonnerer med markedets dypeste smertepunkter.",
                hook="Hvorfor manuelle konsultasjoner bremser din vekst og hvordan du kan skalere din ekspertise uten å ofre din frihet.",
                structure_points=["Innledning: Hook & Story", "Origin Story: Broen til innsikt", "The One Thing: Ditt fundament", "3 Hemmeligheter: Strategisk skifte", "Mekanismen: Hvordan det virker", "Overgangen til tilbud"],
                secrets=[
                    {
                        "assumption": "Jeg trenger et stort publikum for å lykkes.",
                        "belief": "Du trenger bare et 'Ready' publikum som forstår din verdi.",
                        "story": "Da jeg startet, trodde jeg at titusenvis av følgere var nøkkelen. Jeg brukte måneder på å bygge volum, men bankkontoen sto stille. Det var ikke før jeg lærte å spisse budskapet mitt mot de 100 personene som faktisk hadde problemet jeg løste, at alt endret seg. Resultatet var min første 100k måned med under 500 følgere. Dette beviser at relevans trumfer volum hver eneste gang.",
                        "transformation": "Fra massedistribusjon til målrettet autoritet."
                    },
                    {
                        "assumption": "Salg føles påtrengende og ubehagelig.",
                        "belief": "Salg er den høyeste formen for tjeneste når du løser et ekte problem.",
                        "story": "Husk den gangen du hjalp en venn med et problem de hadde kjempet med i årevis. Hvordan føltes det? Det er nøyaktig det et profesjonelt webinar gjør. Du gir dem løsningen før de i det hele tatt har betalt. Ved å skifte fokus fra 'hva jeg får' til 'hva de oppnår', forsvinner alt ubehag. Du er ikke lenger en selger, du er en doktor som skriver ut en livsviktig resept.",
                        "transformation": "Fra frykt for salg til glede over å bidra."
                    },
                    {
                        "assumption": "Teknologien er for komplisert for meg.",
                        "belief": "Budskapet ditt er motoren; teknologien er bare karosseriet.",
                        "story": "Jeg har sett perfekte funnels med dyre verktøy som konverterte null. Og jeg har sett 'stygge' webinarer med enkle slides som genererte millioner. Forskjellen? Den psykologiske strukturen i budskapet. Ikke la mangelen på teknisk innsikt stoppe deg. Med våre rammeverk er den tekniske biten så enkel at du kan fokusere 100% på det som faktisk teller: Å endre liv.",
                        "transformation": "Fra teknisk forvirring til strategisk klarhet."
                    }
                ],
                mechanism="Authority Beacon Framework",
                narrative_angle="Positioning the mentor as a reluctant hero who discovered a 'flaw' in the industry standard, making their success inevitable.",
                offer_transition_logic="Moving from the 'One Thing' methodology directly into the support system required to implement it without technical overwhelm.",
                value_anchor={"price": ["19 997"], "comparison": ["Måneder med prøving og feiling", "Hundretusenvis i tapt omsetning"]},
                bonus_ideas=["Fullstendig implementeringsguide", "Ukentlig coaching calls"],
                cta_sentence="Sikre din plass på transformasjonsreisen i dag.",
                promises=["Skaler din mentorvirksomhet", "Oppnå full geografisk frihet", "Bygg en bærekraftig forretningsmodell"]
            ),
            Concept(
                title="The Hybrid-Expert Model",
                big_idea="Markedet beveger seg bort fra rene informasjonskurs og mot implementeringsstøtte. Hybrid-modellen kombinerer det beste fra skalerbare nettkurs med resultatsikkerheten til 1-til-1 coaching. Ved å strukturere kunnskapen din modulært, men tilby skreddersydd støtte på de kritiske flaskehalsene, kan du levere bedre resultater til flere kunder på kortere tid. Dette er fremtiden for høyt betalte eksperter.",
                hook="Slutt å bytte tid mot penger: Hvordan levere premium resultater på autopilot uten å miste den personlige kontakten.",
                structure_points=["Det nye markedsbehovet", "Hvorfor gamle modeller feiler", "Hybrid-løsningen", "Skalerbarhetsparadokset", "Systematisert suksess"],
                secrets=[
                    {
                        "assumption": "Personlig oppfølging skaleringens fiende.",
                        "belief": "Strukturert personlig oppfølging er nøkkelen til premium prising.",
                        "story": "Mange tror de må fjerne seg selv helt for å skalere. Jeg gjorde det motsatte. Jeg identifiserte de 3 stedene kundene mine alltid satt fast, og laget dedikerte støttesystemer kun der. Resten automatiserte jeg. Resultatet? Kundene følte seg mer sett enn noensinne, mens jeg jobbet 80% mindre. Det handler om kirurgisk presisjon i tidsbruken din.",
                        "transformation": "Fra utbrent 'gjør-alt-selv' til strategisk veileder."
                    }
                ],
                mechanism="Precision Support Architecture",
                narrative_angle="The 'In-the-Trenches' Validated Discovery. You aren't teaching theory; you are sharing the exact operational blueprint requiring this shift.",
                offer_transition_logic="Showcasing that the only gap between their current hustle and the hybrid freedom is the 'Architecture' (the offer).",
                value_anchor={"price": ["25 000"], "comparison": ["Ansette ekstra ansatte", "År med prøving og feiling"]},
                bonus_ideas=["Copy-paste malverk", "Salgsskript for high-ticket"],
                cta_sentence="Søk om plass i Hybrid-akademiet.",
                promises=["Frigjør 20+ timer i uken", "Øk kunde-LTV", "Bygg et salgbart system"]
            ),
            Concept(
                title="Elite-Mindset Metoden",
                big_idea="Strategi er verdiløst uten gjennomføringskraft. De fleste gründere vet *hva* de skal gjøre, men gjør det ikke. Hvorfor? Fordi deres interne 'termostat' er satt for lavt. Dette webinaret handler ikke om nye taktikker, men om å omprogrammere din underbevissthet for suksess. Vi dykker ned i nevrovitenskapen bak prestasjon og viser hvordan du kan knuse de usynlige glasstakene som holder deg tilbake.",
                hook="Er din egen hjerne den største flaskehalsen i bedriften din? Avslør de ubevisste sabotørene som koster deg millioner.",
                structure_points=["Det usynlige taket", "Identitetsskiftet", "Nevroplastisitet i praksis", "Den nye normalen", "Forpliktelsen"],
                secrets=[
                    {
                        "assumption": "Jeg trenger mer kunnskap for å lykkes.",
                        "belief": "Du trenger mindre støy og mer fokusert action.",
                        "story": "Jeg samlet på kurs. Harddisken min var full av PDF-er jeg aldri leste. Jeg trodde neste kurs var 'the missing link'. Men da jeg stoppet opp og så på de som virkelig lyktes, så jeg et mønster: De kunne mindre enn meg, men de *gjorde* mer. Jeg sluttet å lære og begynte å avlære. Jeg fjernet støyen. Da kom resultatene.",
                        "transformation": "Fra evig student til resultatskaper."
                    }
                ],
                mechanism="Neuro-Performance Reprogramming",
                narrative_angle="The Hard Truth / Tough Love approach. Direct, honest, and cutting through the excuses to the root cause.",
                offer_transition_logic="The content reveals the subconscious blocks; the offer provides the immersive environment and accountability needed to permanently break them.",
                value_anchor={"price": ["15 000"], "comparison": ["Terapitimer", "Business-coaching uten effekt"]},
                bonus_ideas=["Daglig morgen-priming lydfil", "Akutt stress-mastery verktøy"],
                cta_sentence="Bli med i elite-programmet og ta kontroll over din skjebne.",
                promises=["Knus prokrastinering", "Øk din finansielle termostat", "Bli en uovervinnelig leder"]
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

    def _get_mock_response(self, reason: str = "API error") -> dict:
        """Return mock concepts response dict (no DB)."""
        mock_concepts = self._get_mock_concepts()
        return {
            "original": "MOCK GENERATION - OpenAI quota/API issue. Using demo concepts.",
            "evaluation": "MOCK EVALUATION",
            "improved": "MOCK IMPROVEMENT",
            "concepts_count": len(mock_concepts),
            "mock_fallback": True,
            "mock_reason": reason
        }

    async def _apply_mock_concepts_and_return(self, asset: WebinarAsset, reason: str = "API error") -> dict:
        """Apply mock concepts to asset and return response. Used for fallback when OpenAI fails."""
        mock_concepts = self._get_mock_concepts()
        asset.concepts_original = mock_concepts
        asset.concepts_improved = mock_concepts
        asset.concepts_evaluated = f"MOCK EVALUATION ({reason})"
        try:
            await asset.save()
            print(f"[WebinarAI] Asset saved with MOCK concepts (reason: {reason})")
        except Exception as save_err:
            print(f"[WebinarAI] WARNING: Could not save mock concepts to DB: {save_err}. Returning anyway.")
        return self._get_mock_response(reason)

    async def apply_mock_fallback_for_asset(self, asset_id: str, reason: str = "429 fallback") -> dict:
        """Public: Get asset, apply mock concepts, return. For router-level fallback."""
        asset = await WebinarAsset.get(asset_id)
        if not asset:
            raise ValueError("Asset not found")
        return await self._apply_mock_concepts_and_return(asset, reason)

    async def generate_concepts_chain(self, asset_id: str) -> dict:
        print(f"DEBUG: generate_concepts_chain called for {asset_id}")
        print(f"DEBUG: USE_MOCK_OPENAI = {USE_MOCK_OPENAI}")
        
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
                        narrative_angle=item.get("narrative_angle", ""),
                        offer_transition_logic=item.get("offer_transition_logic", ""),
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
                narrative_angle="",
                offer_transition_logic="",
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

        if USE_MOCK_OPENAI:
            mock_structure = "# Part 1: Intro\nSlide 1: Hook\nSlide 2: Big Idea\n# Part 2: Secrets\nSlide 3: Secret 1\n# Part 3: Offer\nSlide 80: The Pitch"
            asset.structure_content = mock_structure
            await asset.save()
            return mock_structure
            
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
        from api.models import EmailPlan, EmailDraft
        asset = await WebinarAsset.get(asset_id)
        if not asset:
            raise ValueError("Asset not found")

        if USE_MOCK_OPENAI:
            mock_drafts = [
                EmailDraft(
                    order=1, 
                    day="Day 0",
                    subject="Mock Pre-Webinar", 
                    preview_text="Don't miss this...",
                    body="Mock Body Paragraph 1\n\nMock Body Paragraph 2", 
                    cta="Link: https://example.com/join",
                    send_timing="1h before", 
                    purpose="Reminder", 
                    segment="pre_webinar"
                ),
                EmailDraft(
                    order=2, 
                    day="Day 1",
                    subject="Mock Sales", 
                    preview_text="Open for recording...",
                    body="Mock Body Paragraph 1\n\nMock Body Paragraph 2", 
                    cta="Link: https://example.com/buy",
                    send_timing="1d after", 
                    purpose="Pitch", 
                    segment="sales"
                )
            ]
            asset.email_plan = EmailPlan(timeline=[], emails=mock_drafts, strategy_notes="Mock Strategy")
            asset.email_plan_content = "Mock Overall Strategy"
            await asset.save()
            return "Mock Overall Strategy"
            
        print(f"[WebinarAI] Starting Phase 3 (Emails) for asset {asset_id}")

        # 1. Generate Strategy/Plan
        prompt_1 = EMAIL_STRATEGY_PROMPT.format(
            concept=asset.selected_concept.big_idea if asset.selected_concept else "",
            structure=structure_text
        )
        strategy_text = await self.generate_content(prompt_1)
        asset.email_plan_content = strategy_text
        print(f"[WebinarAI] Strategy generated")

        # 2. Generate Drafts (English)
        prompt_2 = EMAIL_GENERATION_PROMPT.format(strategy=strategy_text)
        drafts_text = await self.generate_content(prompt_2)
        print(f"[WebinarAI] Drafts generated")

        # 3. Evaluate (English)
        prompt_3 = EMAIL_EVALUATION_PROMPT.format(emails=drafts_text)
        evaluation_text = await self.generate_content(prompt_3)
        print(f"[WebinarAI] Evaluation complete")

        # 4. Improve (English)
        prompt_4 = EMAIL_IMPROVEMENT_PROMPT.format(
            emails=drafts_text,
            evaluation=evaluation_text
        )
        improved_text = await self.generate_content(prompt_4)
        print(f"[WebinarAI] Improvement complete")

        # Parse Final Emails
        try:
            import re
            json_match = re.search(r'\[\s*\{.*\}\s*\]', improved_text, re.DOTALL)
            if json_match:
                improved_data = json.loads(json_match.group())
                
                email_drafts = []
                for idx, item in enumerate(improved_data):
                    email_drafts.append(EmailDraft(
                        order=idx + 1,
                        subject=item.get("subject", "No Subject"),
                        preview_text=item.get("preview_text", ""), # or fallback
                        body=item.get("body", ""),
                        send_timing=item.get("timing", "TBD"),
                        purpose=item.get("goal", ""), # or 'type'
                        segment=item.get("type", "General")
                    ))
                
                asset.email_plan = EmailPlan(
                    timeline=[], # Optional
                    emails=email_drafts,
                    strategy_notes=strategy_text[:1000]
                )
                print(f"[WebinarAI] Parsed {len(email_drafts)} emails into plan")
        except Exception as parse_err:
            print(f"[WebinarAI] Error parsing improved emails: {parse_err}")

        await asset.save()
        return strategy_text

    async def generate_single_email_chain(self, email_outline: str, concept_context: str) -> dict:
        """
        Generates a single email with the 3-step loop (Draft -> Eval -> Improve).
        This is the core "Machine Learning" loop for Email Production.
        """
        # 1. Draft
        prompt_1 = EMAIL_GENERATION_PROMPT.format(strategy=email_outline)
        print("   -> Drafting Email...")
        draft_text = await self.generate_content(prompt_1)
        
        # 2. Evaluate
        prompt_2 = EMAIL_EVALUATION_PROMPT.format(emails=draft_text)
        print("   -> Self-Evaluating Email...")
        evaluation_text = await self.generate_content(prompt_2)
        
        # 3. Improve
        prompt_3 = EMAIL_IMPROVEMENT_PROMPT.format(
            emails=draft_text,
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
