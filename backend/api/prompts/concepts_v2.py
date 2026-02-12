# ENGLISH PROMPTS (STANDARD V2)

CONCEPT_GENERATION_PROMPT = """
# PROFESSIONAL WEBINAR CONCEPT GENERATION (CHANGE 2.0 STANDARD)

**Task:**
Develop **three elite webinar concepts** based on the provided onboarding documents and hook analysis. 
These concepts must be high-converting, deeply structured, and ready for automation.

**CRITICAL STYLE REQUIREMENT:**
- You MUST write every section as **FULL, PROFESSIONAL PARAGRAPHS**.
- NO bullet points. NO short fragments.
- TONE: Professional, authoritative, and Norwegian-market friendly (no hype, no US-style exaggeration).
- LANGUAGE: Write in Norwegian (Bokmål).
- Minimum 2-3 detailed paragraphs for "big_idea" and "mechanism".
- Each "story" in the secret structure must be at least 3 detailed paragraphs long, containing a clear setup, conflict, and resolution.

---
## INPUT DATA
**ONBOARDING DOCUMENT:**
{onboarding_doc}

**HOOK ANALYSIS:**
{hook_analysis}

---
# OUTPUT FORMAT - JSON ARRAY ONLY
```json
[
  {{
    "title": "Professional curiosity-driven title",
    "big_idea": "A 2-3 paragraph explanation of the core transformation and 'The One Thing'.",
    "hook": "High-converting opening narrative hook.",
    "structure_points": ["Hook", "Story", "Secrets", "Mechanism", "Offer"],
    "secrets": [
      {{
        "assumption": "False belief (1 paragraph)",
        "belief": "New empowering truth (1 paragraph)",
        "story": "A multi-paragraph (3+) detailed story breaking the old assumption (Perfect Webinar style).",
        "transformation": "The internal psychological shift (1 paragraph)"
      }}
    ],
    "mechanism": "A 2-3 paragraph technical explanation of why your method works when others fail (The Unique Mechanism).",
    "narrative_angle": "A detailed explanation of the narrative framing and angle used for this concept (1-2 paragraphs).",
    "offer_transition_logic": "Deeply structured logic on how the teaching naturally leads to the offer (1-2 paragraphs).",
    "value_anchor": {{"outcomes": ["Detailed outcome 1", "Detailed outcome 2"]}},
    "bonus_ideas": ["High-value bonus 1", "High-value bonus 2"],
    "cta_sentence": "Professional, low-friction call to action.",
    "promises": ["Core benefit 1", "Core benefit 2", "Core benefit 3"]
  }}
]
```
Return ONLY the JSON. Align with 'Perfect Webinar' + 'GOAT' frameworks.
"""

CONCEPT_EVALUATION_PROMPT = """
# Concept Self-Evaluation Prompt (Change 2.0)

**Task:**
Evaluate the three webinar concepts critically against Change 2.0 standards.

**CONCEPTS:**
{concepts}

**Evaluation Criteria:**
1. **Market Fit:** Is it professional and Norwegian-market friendly? No hype?
2. **Big Idea:** Is it clear, strong, and capable of carrying the webinar?
3. **Secret Structure:** Do the stories effectively shift beliefs (Perfect Webinar style)?
4. **Mechanism:** Is the unique mechanism compelling and logical?
5. **Narrative Angle:** Is the angle distinct and resonant?
6. **Offer Transition:** Is the logic from value to pitch seamless and non-pushy?

Provide:
- A summary assessment
- A detailed assessment of each concept
- A list of specific improvement instructions.
"""

CONCEPT_IMPROVEMENT_PROMPT = """
# Concept Implementation Prompt (Change 2.0)

**Task:**
Improve the three webinar concepts based on the evaluation findings.

**ORIGINAL CONCEPTS:**
{concepts}

**EVALUATION:**
{evaluation}

**Requirements:**
- Implement all improvements directly.
- Maintain the same JSON structure as the generation prompt.
- Ensure all paragraphs remain detailed and professional.
- Strengthen the "Unique Mechanism" and "Offer Transition Logic".
"""
