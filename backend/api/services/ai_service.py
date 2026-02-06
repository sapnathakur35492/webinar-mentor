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
        self.model = "gpt-4o-mini"
        
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
                "big_idea": f"Den {mentor_name} Transformasjonsmetoden representerer et paradigmeskifte i hvordan vi tenker på personlig og profesjonell vekst. I motsetning til tradisjonelle tilnærminger som fokuserer på overflatereparasjoner og raske løsninger, går denne metoden dypt inn i de underliggende strukturene som skaper varige endringer.\n\nDenne metoden er utviklet gjennom år med erfaring og forskning, og kombinerer de beste elementene fra psykologi, nevrocivitenskap og praktisk forretningskunnskap. Den er spesielt designet for det norske markedet, hvor autentisitet og substans verdsettes over tomme løfter.\n\nResultatene taler for seg selv: klienter oppnår ikke bare kortsiktige gevinster, men bygger et fundament for kontinuerlig vekst og suksess.",
                "unique_mechanism": "3-Stegs Automatisert Protokoll er en systematisk tilnærming som eliminerer gjetting og tilfeldigheter fra transformasjonsprosessen. Det første steget handler om å kartlegge din nåværende situasjon med presisjon, det andre steget implementerer bevisbaserte strategier, og det tredje steget sikrer varig endring gjennom automatiserte systemer.\n\nDet som gjør denne protokollen unik er at den ikke krever kontinuerlig viljestyring eller motivasjon. I stedet bygger den automatiske vaner og systemer som arbeider for deg selv når energien er lav.\n\nDenne tilnærmingen er testet på hundrevis av klienter i det norske markedet og har vist konsistente resultater på tvers av bransjer og personlighetstyper.",
                "hook": "Slutt å kaste bort tid på ineffektive metoder som lover gull og grønne skoger, men aldri leverer varig endring. Oppdag hvorfor 95% av selvhjelpsmetodene feiler, og hva du kan gjøre i stedet for å sikre faktiske resultater.",
                "secret_structure": [
                    {
                        "old_assumption": "De fleste tror at suksess handler om å jobbe hardere og lengre. Jo mer innsats du legger inn, jo bedre resultater får du. Denne tankegangen fører til utbrenthet og frustrasjon når resultatene ikke matcher innsatsen.",
                        "new_belief": "Suksess handler ikke om mengden arbeid, men om kvaliteten på systemene du bygger. Smarte systemer multipliserer innsatsen din og gir eksponentielle resultater med samme eller mindre arbeid.",
                        "story": "Jeg husker da jeg selv satt på kontoret til klokken ble tolv hver kveld. Jeg trodde at hvis jeg bare jobbet litt hardere, litt lengre, ville gjennombruddet komme. Men alt jeg oppnådde var å bli mer og mer sliten.\n\nDet var først da jeg møtte min mentor Erik at alt endret seg. Han spurte meg et enkelt spørsmål: 'Hva om problemet ikke er at du jobber for lite, men at du jobber feil?' Det spørsmålet endret hele min tilnærming til arbeid og suksess.\n\nJeg begynte å fokusere på å bygge systemer i stedet for å legge inn timer. Resultatet? Inntektene mine doblet seg mens arbeidstimene ble halvert. Nå jobber jeg 4 dager i uken og har mer energi enn noensinne.",
                        "transformation": "Reisen fra utbrenthet til balanse handler om å skifte fokus fra aktivitet til effektivitet. Når du slutter å måle suksess i timer og begynner å måle den i resultater, frigjør du deg fra det endeløse hamsterhjulet og finner virkelig frihet."
                    },
                    {
                        "old_assumption": "Folk tror at kvalitet tar tid og at du ikke kan levere noe bra raskt. Enten må du velge fart ELLER kvalitet, du kan ikke ha begge deler. Dette fører til endeløs perfeksjonisme som aldri resulterer i handling.",
                        "new_belief": "Fart skaper kvalitet gjennom rask iterasjon og feedback. Ved å lansere raskt og forbedre kontinuerlig, lærer du mye mer enn gjennom endeløs planlegging. MVP-tankegangen er nøkkelen til suksess i den moderne verden.",
                        "story": "Min første store fiasko var et prosjekt jeg jobbet på i 18 måneder. Jeg ville at alt skulle være perfekt før lansering. Resultatet? Da vi endelig lanserte, hadde markedet beveget seg, og produktet var utdatert.\n\nMin verste konkurrent lanserte en halvferdig løsning på tre måneder. Jeg lo av kvaliteten. Men de lyttet til kundene, itererte raskt, og innen et år hadde de et produkt som var bedre enn mitt noensinne kunne blitt.\n\nDen leksen kostet meg millioner, men den lærte meg verdien av å handle raskt og forbedre underveis i stedet for å vente på perfeksjon som aldri kommer.",
                        "transformation": "Fra perfeksjonisme til progresjon. Når du aksepterer at 'godt nok' i dag er bedre enn 'perfekt' i morgen, frigjør du deg til å ta action, lære av feil, og faktisk oppnå resultatene du drømmer om."
                    },
                    {
                        "old_assumption": "AI og teknologi er for komplisert for vanlige folk. Du trenger teknisk bakgrunn, programmeringsferdigheter, eller i det minste måneder med opplæring for å dra nytte av disse verktøyene.",
                        "new_belief": "AI er blitt så tilgjengelig at hvem som helst kan bruke det effektivt med riktig veiledning. I dag handler det ikke om tekniske ferdigheter, men om å stille de riktige spørsmålene og forstå hvordan AI kan hjelpe deg.",
                        "story": "Min bestemor Astrid er 78 år gammel og har aldri vært komfortabel med teknologi. Hun brukte fortsatt en gammeldags telefon og sendte brev i stedet for e-post. Jeg var sikker på at AI var helt utenfor hennes rekkevidde.\n\nEn dag, etter litt overtalelse, satte jeg meg ned med henne og viste henne hvordan hun kunne bruke ChatGPT til å skrive julekort. Hun var skeptisk i begynnelsen, men innen en time satt hun og klapte i hendene av begeistring.\n\nNå bruker bestemor AI til alt fra å planlegge hagestell til å finne oppskrifter. Hvis hun kan lære det, kan absolutt alle det. Det handler bare om å ha noen som viser deg veien.",
                        "transformation": "Fra frykt til kraft. Teknologi trenger ikke være skremmende når du har riktig veiledning. Ved å omfavne AI som et verktøy, åpner du dører til muligheter du aldri visste eksisterte."
                    }
                ],
                "epiphany_bridge": "Min egen reise fra frustrert bedriftseier til frigjort entreprenør startet med et sammenbrudd. Jeg jobbet 80 timer i uken og så familien min forsvinne. Det var først da jeg traff veggen at jeg innså at noe måtte endre seg fundamentalt.\n\nDet var ikke et kvikfix som reddet meg, men en total omlegging av hvordan jeg tenkte om arbeid, suksess og livet. Denne transformasjonen tok tid, men den ga meg tilbake livet mitt og skapte en virksomhet som vokser selv når jeg er på ferie.",
                "offer_transition_logic": "Når du har forstått prinsippene bak denne transformasjonen, er neste natulige steg å implementere den i din egen situasjon. Det er her mitt program kommer inn - det gir deg veikart, verktøy og støtte til å gjøre denne reisen effektivt.\n\nI stedet for å bruke år på å finne frem selv, får du tilgang til en bevist metode som har hjulpet hundrevis av nordmenn til å oppnå den samme friheten og suksessen.",
                "psychological_structure": "Webinaret følger den klassiske Hook → Story → Offer strukturen. Vi starter med å fange oppmerksomheten gjennom å utfordre etablerte antakelser, bygger tillit og emosjonell forbindelse gjennom autentiske historier, og avslutter med et naturlig tilbud som føles som den logiske neste steget."
            },
            "concept_2": {
                "big_idea": "Hemmeligheten bak Rask Vekst handler om å forstå de skjulte systemene som driver eksponentielle resultater. Mens de fleste fokuserer på lineær vekst - steg for steg, time for time - finnes det en annen vei som gir dramatisk bedre resultater på kortere tid.\n\nDette konseptet utfordrer den konvensjonelle visdommen om at suksess krever årevis av slit. I stedet viser det hvordan du kan oppnå på 90 dager det de fleste bruker år på.\n\nNøkkelen ligger ikke i å jobbe hardere, men i å forstå og utnytte de usynlige 'vekstakseleratorene' som få kjenner til.",
                "unique_mechanism": "Skalerbar Suksessformel er et rammeverk som identifiserer de kritiske 20% av aktivitetene som genererer 80% av resultatene. Ved å fokusere energi kun på disse høy-impact aktivitetene, frigjøres ressurser som kan reinvesteres i enda mer vekst.\n\nFormelen inkluderer konkrete strategier for å automatisere repetitive oppgaver, delegere effektivt, og bygge systemer som skalerer uten å kreve proporsjonalt mer tid eller energi.",
                "hook": "Hvordan jeg oppnådde 10x vekst på 90 dager uten å jobbe mer enn 30 timer i uken. Denne historien vil utfordre alt du tror du vet om hva som kreves for å lykkes.",
                "secret_structure": [
                    {
                        "old_assumption": "Tid er fast og konstant. Vi har alle 24 timer i døgnet, og det er umulig å 'lage mer tid'. Suksess handler derfor om tidsstyring og prioritering.",
                        "new_belief": "Tid er elastisk når du forstår hvordan du kan multiplisere effekten av timene dine. Gjennom riktige systemer, delegering og fokus, kan én time gi resultater tilsvarende ti timer med tradisjonell tilnærming.",
                        "story": "Tim Ferriss introduserte meg for konseptet '4-timers arbeidsuke' da jeg var på mitt mest overarbeidede. I begynnelsen trodde jeg det var ren markedsføring - umulig å ta seriøst.\n\nMen jeg bestemte meg for å eksperimentere. Jeg begynte med å spore nøyaktig hvor tiden min gikk og hva som faktisk produserte resultater. Sjokkerende nok viste det seg at 80% av inntektene kom fra bare 20% av aktivitetene mine.\n\nDa jeg eliminerte eller delegerte resten og fokuserte kun på det som virkelig betydde noe, eksploderte produktiviteten. Det føltes som magi, men det var bare matematikk.",
                        "transformation": "Fra utbrenthet til balanse. Når du slutter å prøve å gjøre alt og begynner å fokusere på det som faktisk teller, åpner du opp for et liv med både suksess OG frihet."
                    },
                    {
                        "old_assumption": "Du må være ekspert på alt i din virksomhet. Som leder og grunnlegger må du forstå hver detalj og kunne gjøre hver oppgave selv.",
                        "new_belief": "De mest suksessrike lederne vet hva de IKKE skal gjøre. Ved å bygge team av spesialister og fokusere på din unike styrke, multipliseres resultatene dramatisk.",
                        "story": "I mine tidlige år som gründer prøvde jeg å være en enmannshær. Jeg gjorde regnskap, markedsføring, salg, kundeservice - alt. Resultatet var middelmådighet på alle fronter og total utmattelse.\n\nDet var først da jeg fikk råd om å ansette min første assistent at ting begynte å endre seg. Først var det skremmende å gi fra seg kontroll, men snart så jeg at andre kunne gjøre mange ting bedre enn meg.\n\nNå fokuserer jeg kun på det jeg er best på - strategi og relasjonsbygging - og har et team som håndterer alt annet. Virksomheten vokser raskere enn noensinne, og jeg har faktisk tid til å tenke.",
                        "transformation": "Fra kontrollbehov til tillit. Når du lærer å slippe taket og stole på at andre kan bidra, frigjøres du til å fokusere på ditt virkelige potensial."
                    },
                    {
                        "old_assumption": "Vekst krever kontinuerlig personlig deltakelse. Jo større du vokser, jo mer må du jobbe for å holde det hele sammen.",
                        "new_belief": "Ekte skalerbar vekst frigjør lederen. Ved å bygge systemer og prosesser som fungerer uavhengig av deg, kan virksomheten vokse eksponentielt uten proporsjonalt mer arbeid.",
                        "story": "Jeg hadde alltid drømt om å ta en ekte ferie - en hvor jeg faktisk var tilstede og ikke sjekket e-post hvert tiende minutt. Men virksomheten føltes som en nyfødt baby som krevde konstant oppmerksomhet.\n\nDet tok ett helt år å dokumentere prosesser og bygge systemer. Noen ganger føltes det som bortkastet tid. Men da jeg endelig tok de tre ukene i Thailand og kom tilbake til en virksomhet som hadde vokst i mitt fravær, visste jeg at det hadde vært verdt det.\n\nNå kan jeg være borte i måneder om jeg vil. Virksomheten trenger meg ikke på den måten lenger - den er designet for å fungere og vokse uavhengig av min daglige tilstedeværelse.",
                        "transformation": "Fra fange til fri. Når du bygger en virksomhet som ikke er avhengig av deg, skaper du virkelig frihet og et liv på dine egne premisser."
                    }
                ],
                "epiphany_bridge": "Mitt eget gjennombrudd kom da jeg innså at jeg ikke drev en virksomhet - jeg hadde kjøpt meg en jobb. Alt avhang av meg, og uten min konstante tilstedeværelse stoppet alt.\n\nDen erkjennelsen var smertefull, men den var også starten på en fundamental transformasjon. Jeg begynte å tenke som en arkitekt i stedet for en arbeider, og resultatene endret alt.",
                "offer_transition_logic": "Du har nå sett hva som er mulig. Spørsmålet er ikke om disse prinsippene fungerer - det har du fått bevis for. Spørsmålet er hvordan du implementerer dem i din situasjon.\n\nMitt tilbud gir deg det komplette systemet, veiledningen og fellesskapet du trenger for å gjøre denne transformasjonen effektivt og raskt.",
                "psychological_structure": "Vi bruker Hook → Story → Offer strukturen for å bygge interesse, skape identifikasjon gjennom historier, og presentere løsningen som det naturlige neste steget i publikums reise."
            },
            "concept_3": {
                "big_idea": "Den Norske Markedsfordelen handler om å forstå hvorfor strategier som fungerer i USA ofte feiler spektakulært i Norge und Skandinavia. Det norske markedet har unike kulturelle og psykologiske faktorer som krever en tilpasset tilnærming.\n\nDette konseptet er for de som har prøvd 'amerikanske' metoder og blitt skuffet. Det forklarer HVORFOR de feilet og presenterer en alternativ vei som respekterer norske verdier.\n\nVed å forstå og utnytte disse kulturelle forskjellene, kan du oppnå resultater som føles autentiske og bygger ekte tillit hos norske kunder.",
                "unique_mechanism": "Kulturelt Tilpasset Strategi er et rammeverk utviklet spesifikt for det norske markedet. Det tar hensyn til faktorer som janteloven, tillit til institusjoner, og den norske preferansen for substans over stil.\n\nI stedet for aggressive salgsmetoder bruker denne tilnærmingen relasjonbyggende teknikker som føles naturlige i en norsk kontekst. Resultatene er høyere tillit, bedre konvertering, og kunder som blir værende.",
                "hook": "Hvorfor amerikanske metoder feiler i Norge - og hva du kan gjøre i stedet for å lykkes i det norske markedet uten å føle deg som en sleip selger.",
                "secret_structure": [
                    {
                        "old_assumption": "God markedsføring er universell. Hvis noe fungerer i det største markedet (USA), bør det fungere enda bedre i mindre markeder som Norge.",
                        "new_belief": "Effektiv markedsføring må tilpasses kulturell kontekst. Det som virker som overbevisende i én kultur kan oppfattes som påtrengende eller useriøst i en annen.",
                        "story": "Da jeg startet min første virksomhet, søkte jeg inspirasjon fra de store amerikanske markedsføringsgurua. Jeg fulgte oppskriftene deres til punkt og prikke - aggressive overskrifter, kunstig hastverk, garantier med store bokstaver.\n\nResultatene var katastrofale. Norske kunder trakk seg unna. Én dame ringte meg faktisk for å si at markedsføringen min fikk henne til å føle seg manipulert og at hun aldri ville kjøpe fra meg.\n\nDet tok tid, men jeg begynte å forstå at nordmenn har et finstemt bullshit-filter utviklet gjennom generasjoner av kulturell tradisjoner. Du må snakke til dem på en annen måte.",
                        "transformation": "Fra kopist til kulturtolk. Når du slutter å kopiere og begynner å tilpasse, finner du en stemme som resonnerer ekte med dine kunder."
                    },
                    {
                        "old_assumption": "Salg handler om å overbevise folk om at de trenger produktet ditt. Jo mer overbevisende du er, jo bedre selger du.",
                        "new_belief": "I Norge handler godt salg om å bygge tillit og la produktet snakke for seg selv. Nordmenn kjøper fra folk de stoler på, ikke fra folk som presser på.",
                        "story": "Jeg husker et møte med en potensiell storkunde tidlig i karrieren. Jeg hadde forberedt en polert presentasjon med alle de amerikanske salgsteknikkene - urgency, scarcity, emotion.\n\nEtter presentasjonen så kunden på meg og sa: 'Det høres ut som du har gått på salgskurs i USA.' Det var ikke ment som et kompliment. Jeg mistet den kunden.\n\nNeste gang jeg møtte en lignende kunde, droppet jeg skriptet. Jeg fortalte ærlig om produktet, innrømmet svakhetene, og lot kunden ta tid til å tenke. Den kunden kjøpte - og er fortsatt kunde femten år senere.",
                        "transformation": "Fra selger til rådgiver. Når du slutter å pushe og begynner å hjelpe, tiltrekker du kunder som verdsetter ærlighet og bygger relasjoner som varer."
                    },
                    {
                        "old_assumption": "Janteloven er en hindring for suksess. Norsk kultur holder folk tilbake fra å tenke stort og oppnå sitt potensial.",
                        "new_belief": "Janteloven kan være en styrke når den forstås riktig. Den skaper et marked hvor substans verdsettes over selvskryt, og hvor ekte kvalitet utmerker seg.",
                        "story": "Jeg pleide å irritere meg over janteloven. Hvorfor kunne ikke nordmenn feire suksess som amerikanerne? Hvorfor måtte alt være så dempet og beskjedent?\n\nMen så begynte jeg å se det fra en annen vinkel. I et marked fullt av hype og overdrivelser, skiller de som faktisk leverer seg ut. Når du ikke kan skryte, må du vise resultater. Når du ikke kan overdrive, må produktet snakke for seg selv.\n\nNå ser jeg janteloven som en konkurransefordel. De som faktisk er gode, vinner. De som bare later som, avsløres raskt. Det er et marked hvor substans trumfer stil.",
                        "transformation": "Fra motstand til aksept. Når du omfavner kulturelle normer i stedet for å kjempe mot dem, finner du uventede fordeler og muligheter."
                    }
                ],
                "epiphany_bridge": "Min transformasjon startet med ydmykhet. Etter flere mislykkede forsøk på å kopiere amerikanske strategier, måtte jeg innrømme at jeg ikke forsto mitt eget marked. Det førte til en dyptgående utforskning av hva som faktisk fungerer i Norge.\n\nResultatet var en tilnærming som føles naturlig, bygger ekte tillit, og konverterer bedre enn noe jeg hadde prøvd før.",
                "offer_transition_logic": "Du har nå forstått hvorfor mange strategier feiler i Norge og hva som fungerer i stedet. Mitt program gir deg det komplette rammeverket for å implementere disse prinsippene i din virksomhet.\n\nI stedet for å prøve og feile på egenhånd, får du tilgang til bevist metodikk og et fellesskap av norske entreprenører som deler din tilnærming.",
                "psychological_structure": "Webinaret bruker en tillitbyggende struktur tilpasset norsk publikum. Vi unngår hype og fokuserer på autentiske historier, konkrete bevis, og en respektfull tilnærming til tilbudet."
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
