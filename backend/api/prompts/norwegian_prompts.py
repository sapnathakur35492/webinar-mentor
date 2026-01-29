"""
Norwegian AI Prompts for WebinarAgent
Based on Christopher's Notion specification
"""

# System Prompt - WebinarMasterOS
WEBINAR_MASTER_OS_PROMPT = """
Du er WebinarMasterOS - en ekspert på konverteringsoptimaliserte webinarer for det norske markedet.

Din oppgave er å kombinere Russell Brunsons "Perfect Webinar" metodikk med Jason Fladliens "GOAT Webinars" prinsipper, tilpasset norsk kultur og forretningspraksis.

Nøkkelprinsipper:
- Profesjonell, trygg og tillitvekkende tone (IKKE "hypey" amerikansk stil)
- Fokus på psykologisk struktur og historiefortelling
- Bruk av "Big Idea" og "Unique Mechanism"
- Epiphany Bridge for å bryte falske trossetninger
- Strukturert Hook → Story → Offer progresjon

Alltid generer innhold på norsk med høy kvalitet og konverteringsfokus.
"""

# Stage 1: Concept Generation
CONCEPT_GENERATION_PROMPT = """
Basert på mentorens onboarding-dokument og hook-analyse, generer 3 komplette webinarkonsepter.

For hvert konsept, inkluder:

1. **Big Idea** (Den Ene Tingen)
   - Hva er kjernebudskapet?
   - Hvorfor er dette unikt og verdifullt?

2. **Unique Mechanism** (Den Proprietære Metoden)
   - Hva er mentorens unike tilnærming?
   - Hvordan skiller dette seg fra konkurrentene?

3. **Hook** (Oppmerksomhetsfanger)
   - Åpningslinje som fanger interesse
   - Relevant for målgruppen
   - Skaper nysgjerrighet

4. **Epiphany Bridge** (Historien som bryter falske trossetninger)
   - Mentorens personlige reise
   - Fra problem til løsning
   - Emosjonell forbindelse   

5. **Psykologisk Struktur**
   - Hook: Hvordan fange oppmerksomhet
   - Story: Hvilken historie fortelles
   - Offer: Hvordan presentere tilbudet

Generer 3 distinkte konsepter med ulike vinklinger.
Output som JSON med nøklene: concept_1, concept_2, concept_3.
"""

# Stage 2: Self-Evaluation
SELF_EVALUATION_PROMPT = """
Evaluer de 3 webinarkonseptene mot følgende 8 kriterier (skala 1-10):

1. **Norsk markedstilpasning**
   - Passer tonen og budskapet til norsk kultur?
   - Unngår "hypey" amerikansk stil?

2. **Big Idea klarhet**
   - Er kjernebudskapet tydelig og kraftfullt?
   - Lett å forstå og huske?

3. **Unique Mechanism styrke**
   - Er mekanismen virkelig unik?
   - Troverdig og gjennomførbar?

4. **Psykologisk struktur**
   - Følger Hook → Story → Offer logikken?
   - Naturlig progresjon?

5. **Story/Epiphany Bridge kvalitet**
   - Emosjonelt engasjerende?
   - Bryter falske trossetninger?

6. **Hook effektivitet**
   - Fanger oppmerksomhet umiddelbart?
   - Relevant for målgruppen?

7. **Offer alignment**
   - Passer tilbudet naturlig med historien?
   - Tydelig verdiproposisjon?

8. **Samlet konverteringspotensial**
   - Hvor sannsynlig er det at dette konverterer?
   - Helhetlig vurdering

For hvert konsept, gi:
- Score per kriterie
- Styrker (liste)
- Svakheter (liste)
- Forbedringsforslag

Output som JSON.
"""

# Stage 3: Implementation of Evaluation
IMPLEMENTATION_PROMPT = """
Basert på selvevalueringen, forbedre de 3 webinarkonseptene.

For hvert konsept:
1. Adresser identifiserte svakheter
2. Styrk de beste elementene
3. Implementer forbedringsforslag
4. Behold konseptets kjerne

Fokuser spesielt på:
- Norsk markedstilpasning
- Klarhet i Big Idea
- Styrke i Unique Mechanism
- Emosjonell resonans i historien

Output forbedrede konsepter som JSON med samme struktur som originalen.
"""

# Stage 4: Mentor Feedback Integration
MENTOR_FEEDBACK_PROMPT = """
Basert på transkriptet fra møtet med mentor, rafiner webinarkonseptene.

Analyser transkriptet for:
1. Mentorens preferanser og stil
2. Spesifikke endringer eller justeringer
3. Nye innsikter eller vinklinger
4. Tone og språkvalg

Implementer endringene samtidig som du:
- Bevarer konseptets kjerne
- Respekterer mentorens stemme
- Opprettholder konverteringsfokus
- Sikrer norsk markedstilpasning

Output raffinerte konsepter som JSON.
"""

# Stage 5: Slide-by-Slide Structure
SLIDE_STRUCTURE_PROMPT = """
Lag en detaljert slide-by-slide disposisjon for webinaret (IKKE fullt manus).

For hver slide, inkluder:

1. **Slide-nummer**
2. **Formål/mål** med sliden
3. **Nøkkelpunkter** (ikke fullt manus)
4. **Overgang** til neste slide

Struktur (basert på Perfect Webinar):
- Intro (slides 1-5): Hook, hvem dette er for, hva de lærer
- Teaching (slides 6-20): Verdifullt innhold, bygge tillit
- Secrets (slides 21-40): De 3 hemmelighetene/belief shifts
- Transition (slides 41-50): Fra teaching til tilbud
- Offer (slides 51-70): Presentasjon av tilbud
- Q&A (slides 71-80): Håndtering av innvendinger

Psykologisk progresjon: Hook → Story → Offer

Output som JSON med liste av slides.
"""

# Stage 6: Updated Slide Structure
UPDATED_SLIDE_STRUCTURE_PROMPT = """
Oppdater slide-by-slide disposisjonen basert på mentorens tilbakemelding fra transkriptet.

Fokuser på:
1. Mentorens språk og stemme
2. Spesifikke justeringer fra møtet
3. Forbedret flyt og timing
4. Norsk markedstilpasning

Behold:
- Psykologisk struktur
- Konverteringsfokus
- Perfect Webinar rammeverk

Output oppdatert slide-liste som JSON.
"""

# Stage 7: Email Sequence Overview
EMAIL_SEQUENCE_OVERVIEW_PROMPT = """
Lag en strategisk plan for mailsekvensen.

Inkluder:

1. **Pre-webinar mailer**
   - Invitasjon
   - Påminnelser (24h, 1h før)
   - Forberedelse/forventninger

2. **Post-webinar mailer**
   - Takk for deltakelse
   - Replay-link
   - Urgency/scarcity

3. **No-show oppfølging**
   - Replay tilbud
   - FOMO (fear of missing out)
   - Siste sjanse

Timing og strategi for hver mail.
Output som JSON med mailsekvens-oversikt.
"""

# Stage 8: Email Generation
EMAIL_GENERATION_PROMPT = """
Generer fullstendig mailkopi for hver mail i sekvensen.

For hver mail, inkluder:
1. **Emnelinje** (subject line)
   - Kort og nysgjerrighetsskapende
   - Norsk tone

2. **Innledning**
   - Personlig og relevant
   - Fanger oppmerksomhet

3. **Hovedbudskap**
   - Tydelig og konsis
   - Verdiproposisjon

4. **Call-to-Action (CTA)**
   - Klar og handlingsorientert
   - Enkel å følge

5. **Avslutning**
   - Profesjonell
   - Bygger relasjon

Norsk tone: Profesjonell, varm, tillitvekkende (IKKE "hypey").

Output som JSON med liste av komplette mailer.
"""

# Stage 9: Email Self-Evaluation
EMAIL_SELF_EVALUATION_PROMPT = """
Evaluer mailsekvensen mot følgende kriterier:

1. **Attention (Oppmerksomhet)**
   - Emnelinjer som fanger interesse?
   - Åpningslinjer som engasjerer?

2. **Clarity (Klarhet)**
   - Er budskapet tydelig?
   - Lett å forstå hva som forventes?

3. **Relevance (Relevans)**
   - Relevant for mottakeren?
   - Riktig timing?

4. **Action-oriented (Handlingsorientert)**
   - Tydelig CTA?
   - Enkel å handle på?

For hver mail, gi:
- Score per kriterie (1-10)
- Styrker
- Svakheter
- Forbedringsforslag

Output som JSON.
"""

# Stage 10: Email Evaluation Implementation
EMAIL_EVALUATION_IMPLEMENTATION_PROMPT = """
Forbedre mailsekvensen basert på selvevalueringen.

For hver mail:
1. Styrk emnelinjen
2. Forbedre åpningen
3. Tydeliggjør budskapet
4. Optimaliser CTA
5. Sikre norsk tone

Fokus på:
- Konvertering
- Profesjonalitet
- Norsk markedstilpasning
- Emosjonell resonans

Output forbedrede mailer som JSON.
"""
