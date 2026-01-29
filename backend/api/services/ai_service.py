from core.settings import settings
import json
import logging
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
from api.prompts.norwegian_prompts import *

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self._client = None
        self.model = "gpt-4o"
        
    @property
    def client(self):
        if self._client:
            return self._client
            
        if self.api_key:
            self._client = AsyncOpenAI(api_key=self.api_key)
        else:
            logger.warning("OPENAI_API_KEY is not set. AI features will use MOCKS.")
            
        return self._client

    async def _call_llm(self, system_prompt: str, user_prompt: str, response_format: str = "json_object") -> Any:
        if not self.client:
            raise Exception("OpenAI Client not initialized")
            
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": response_format},
                temperature=0.7,
            )
            content = response.choices[0].message.content
            if response_format == "json_object":
                return json.loads(content)
            return content
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            raise

    # --- Phase 1: Concept Generation (Norwegian) ---

    async def generate_concept(self, mentor_name: str, industry: str, onboarding_doc: str, hook_analysis: str) -> dict:
        """
        Generate 3 webinar concepts in Norwegian
        """
        if not self.client:
            return self._get_mock_concepts(mentor_name)

        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{CONCEPT_GENERATION_PROMPT}

**Mentor Informasjon:**
Navn: {mentor_name}
Bransje: {industry}

**Onboarding-dokument:**
{onboarding_doc[:3000]}...

**Hook-analyse:**
{hook_analysis[:2000]}...

Generer 3 komplette webinarkonsepter på norsk.
        """
        try:
            result = await self._call_llm(system_prompt, user_prompt)
            return result
        except Exception as e:
            logger.error(f"AI Generation Failed: {e}. Falling back to MOCK.")
            return self._get_mock_concepts(mentor_name)

    async def evaluate_concepts(self, concepts: dict) -> dict:
        """
        Self-evaluation of concepts
        """
        if not self.client:
            return self._get_mock_evaluation()
            
        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{SELF_EVALUATION_PROMPT}

**Konsepter å evaluere:**
{json.dumps(concepts, ensure_ascii=False)}

Evaluer alle 3 konseptene mot de 8 kriteriene.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
            return self._get_mock_evaluation()

    async def improve_concepts(self, concepts: dict, evaluation: dict) -> dict:
        """
        Improve concepts based on self-evaluation
        """
        if not self.client:
            return concepts
            
        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{IMPLEMENTATION_PROMPT}

**Originale konsepter:**
{json.dumps(concepts, ensure_ascii=False)}

**Evaluering:**
{json.dumps(evaluation, ensure_ascii=False)}

Forbedre konseptene basert på evalueringen.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Improvement failed: {e}")
            return concepts

    # --- Comprehensive Generation with Auto-Improvement ---

    async def generate_and_improve_concepts(self, mentor_name: str, industry: str, onboarding_doc: str, hook_analysis: str) -> dict:
        """
        Complete cycle: Generate → Evaluate → Improve concepts
        This ensures high quality before presenting to user.
        """
        logger.info("Starting concept generation with auto-improvement cycle")
        
        # Step 1: Generate initial concepts
        concepts = await self.generate_concept(mentor_name, industry, onboarding_doc, hook_analysis)
        logger.info("Initial concepts generated")
        
        # Step 2: Self-evaluate
        evaluation = await self.evaluate_concepts(concepts)
        logger.info("Concepts self-evaluated")
        
        # Step 3: Improve based on evaluation
        improved_concepts = await self.improve_concepts(concepts, evaluation)
        logger.info("Concepts improved based on self-evaluation")
        
        return {
            "original_concepts": concepts,
            "evaluation": evaluation,
            "improved_concepts": improved_concepts
        }

    async def generate_and_improve_structure(self, concept_data: dict) -> dict:
        """
        Complete cycle: Generate → Evaluate (implicit) → Return structure
        """
        logger.info("Starting structure generation with auto-improvement")
        
        # Generate slide structure
        structure = await self.generate_slide_structure(concept_data)
        logger.info(f"Structure generated with {structure.get('total_slides', 0)} slides")
        
        # Note: Structure evaluation can be added here if needed
        # For now, the generation prompt includes quality criteria
        
        return structure

    async def generate_and_improve_emails(self, context: dict) -> dict:
        """
        Complete cycle: Generate Overview → Generate Emails → Evaluate → Improve
        """
        logger.info("Starting email generation with auto-improvement cycle")
        
        # Step 1: Generate email overview/strategy
        overview = await self.generate_email_sequence_overview(context)
        logger.info("Email sequence overview generated")
        
        # Step 2: Generate full email content
        emails = await self.generate_email_sequence(overview)
        logger.info("Email content generated")
        
        # Step 3: Self-evaluate emails
        evaluation = await self.evaluate_emails(emails)
        logger.info("Emails self-evaluated")
        
        # Step 4: Improve based on evaluation
        improved_emails = await self.improve_emails(emails, evaluation)
        logger.info("Emails improved based on self-evaluation")
        
        return {
            "overview": overview,
            "original_emails": emails,
            "evaluation": evaluation,
            "improved_emails": improved_emails
        }

    async def refine_with_transcript(self, concepts: dict, transcript: str) -> dict:
        """
        Refine concepts based on mentor feedback transcript
        """
        if not self.client:
            return concepts
            
        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{MENTOR_FEEDBACK_PROMPT}

**Nåværende konsepter:**
{json.dumps(concepts, ensure_ascii=False)}

**Transkripsjon fra mentor-møte:**
{transcript[:4000]}...

Rafiner konseptene basert på mentorens tilbakemelding.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Transcript refinement failed: {e}")
            return concepts

    # --- Phase 2: Structure (Norwegian) ---

    async def generate_slide_structure(self, concept_data: dict) -> dict:
        """
        Generate slide-by-slide structure
        """
        if not self.client:
            return self._get_mock_slides()

        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{SLIDE_STRUCTURE_PROMPT}

**Valgt webinarkonsept:**
{json.dumps(concept_data, ensure_ascii=False)}

Lag en detaljert slide-by-slide disposisjon.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Structure generation failed: {e}")
            return self._get_mock_slides()

    async def update_structure_with_transcript(self, slides: dict, transcript: str) -> dict:
        """
        Update structure based on mentor feedback
        """
        if not self.client:
            return slides
            
        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{UPDATED_SLIDE_STRUCTURE_PROMPT}

**Nåværende disposisjon:**
{json.dumps(slides, ensure_ascii=False)}

**Transkripsjon fra mentor-møte:**
{transcript[:4000]}...

Oppdater disposisjonen basert på tilbakemelding.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Structure update failed: {e}")
            return slides

    # --- Phase 3: Emails (Norwegian) ---

    async def generate_email_sequence_overview(self, context: dict) -> dict:
        """
        Generate email sequence overview
        """
        if not self.client:
            return self._get_mock_email_overview()

        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{EMAIL_SEQUENCE_OVERVIEW_PROMPT}

**Kontekst:**
{json.dumps(context, ensure_ascii=False)}

Lag en strategisk plan for mailsekvensen.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Email overview failed: {e}")
            return self._get_mock_email_overview()

    async def generate_email_sequence(self, overview: dict) -> dict:
        """
        Generate complete email sequence
        """
        if not self.client:
            return self._get_mock_emails()

        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{EMAIL_GENERATION_PROMPT}

**Mailsekvens-oversikt:**
{json.dumps(overview, ensure_ascii=False)}

Generer fullstendig mailkopi for hver mail.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Email generation failed: {e}")
            return self._get_mock_emails()

    async def evaluate_emails(self, emails: dict) -> dict:
        """
        Self-evaluate email sequence
        """
        if not self.client:
            return self._get_mock_email_evaluation()
            
        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{EMAIL_SELF_EVALUATION_PROMPT}

**Mailsekvens:**
{json.dumps(emails, ensure_ascii=False)}

Evaluer mailsekvensen mot kriteriene.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Email evaluation failed: {e}")
            return self._get_mock_email_evaluation()

    async def improve_emails(self, emails: dict, evaluation: dict) -> dict:
        """
        Improve emails based on evaluation
        """
        if not self.client:
            return emails
            
        system_prompt = WEBINAR_MASTER_OS_PROMPT
        user_prompt = f"""
{EMAIL_EVALUATION_IMPLEMENTATION_PROMPT}

**Nåværende mailer:**
{json.dumps(emails, ensure_ascii=False)}

**Evaluering:**
{json.dumps(evaluation, ensure_ascii=False)}

Forbedre mailsekvensen basert på evalueringen.
        """
        try:
            return await self._call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Email improvement failed: {e}")
            return emails

    # --- Mocks ---

    def _get_mock_concepts(self, mentor_name):
        return {
            "concept_1": {
                "big_idea": f"Den {mentor_name} Transformasjonsmetoden",
                "unique_mechanism": "3-Stegs Automatisert Protokoll",
                "hook": "Slutt å kaste bort tid på ineffektive metoder",
                "epiphany_bridge": "Fra kamp til suksess: Min reise",
                "psychological_structure": "Hook → Story → Offer"
            },
            "concept_2": {
                "big_idea": "Hemmeligheten bak Rask Vekst",
                "unique_mechanism": "Skalerbar Suksessformel",
                "hook": "Hvordan jeg oppnådde 10x vekst på 90 dager",
                "epiphany_bridge": "Gjennombruddet som endret alt",
                "psychological_structure": "Hook → Story → Offer"
            },
            "concept_3": {
                "big_idea": "Den Norske Markedsfordelen",
                "unique_mechanism": "Kulturelt Tilpasset Strategi",
                "hook": "Hvorfor amerikanske metoder feiler i Norge",
                "epiphany_bridge": "Fra fiasko til formue",
                "psychological_structure": "Hook → Story → Offer"
            }
        }

    def _get_mock_evaluation(self):
        return {
            "concept_1_evaluation": {
                "norsk_markedstilpasning": 8,
                "big_idea_klarhet": 7,
                "unique_mechanism_styrke": 8,
                "psykologisk_struktur": 9,
                "story_kvalitet": 7,
                "hook_effektivitet": 8,
                "offer_alignment": 8,
                "konverteringspotensial": 8
            }
        }

    def _get_mock_slides(self):
        return {
            "total_slides": 6,
            "slides": [
                {"slide_number": 1, "section": "intro", "title": "Velkommen", "content_points": ["Introduksjon"], "speaker_notes": "Sett scenen"},
                {"slide_number": 2, "section": "teaching", "title": "Problemet", "content_points": ["Hvorfor de fleste feiler"], "speaker_notes": "Bygg relasjon"},
                {"slide_number": 3, "section": "secrets", "title": "Hemmelighet 1", "content_points": ["First belief shift"], "speaker_notes": "Bryt falsk tro"},
                {"slide_number": 4, "section": "secrets", "title": "Hemmelighet 2", "content_points": ["Second belief shift"], "speaker_notes": "Bygg tillit"},
                {"slide_number": 5, "section": "transition", "title": "Løsningen", "content_points": ["Introduser mekanismen"], "speaker_notes": "Skape begeistring"},
                {"slide_number": 6, "section": "offer", "title": "Tilbudet", "content_points": ["Bli med nå"], "speaker_notes": "Klar CTA"}
            ]
        }

    def _get_mock_email_overview(self):
        return {
            "pre_webinar": ["Invitasjon", "Påminnelse 24h", "Påminnelse 1h"],
            "post_webinar_attendees": ["Takk", "Replay", "Urgency"],
            "post_webinar_no_shows": ["Replay tilbud", "FOMO", "Siste sjanse"]
        }

    def _get_mock_emails(self):
        return {
            "pre_webinar": [
                {"subject": "Du er registrert!", "body": "Vi sees der...", "send_timing": "Umiddelbart"},
                {"subject": "Starter snart", "body": "Ikke gå glipp av...", "send_timing": "24h før"}
            ],
            "post_webinar_attendees": [
                {"subject": "Replay-link", "body": "I tilfelle du gikk glipp av noe...", "send_timing": "2h etter"}
            ]
        }

    def _get_mock_email_evaluation(self):
        return {
            "pre_webinar_1_evaluation": {
                "attention": 8,
                "clarity": 9,
                "relevance": 8,
                "action_oriented": 9
            }
        }

ai_service = AIService()
