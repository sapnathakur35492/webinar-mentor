# NORWEGIAN PROMPTS (COMMENTED OUT)
# CONCEPT_GENERATION_PROMPT = """
# # PERFECT WEBINAR CONCEPT PROMPT
# ... (Norwegian content hidden) ...
# """

# ENGLISH PROMPTS (ACTIVE)

CONCEPT_GENERATION_PROMPT = """
# PROFESSIONAL WEBINAR CONCEPT GENERATION
*(High-Fidelity Paragraph Edition)*

**Task:**
Develop **three elite webinar concepts** based on the provided documents. 

**CRITICAL STYLE REQUIREMENT:**
- You MUST write every section as **FULL, PROFESSIONAL PARAGRAPHS**.
- NO bullet points. NO short fragments.
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
        "story": "A multi-paragraph (3+) detailed story breaking the old assumption.",
        "transformation": "The internal psychological shift (1 paragraph)"
      }}
    ],
    "mechanism": "A 2-3 paragraph technical explanation of why your method works when others fail.",
    "value_anchor": {{"outcomes": ["Detailed outcome 1", "Detailed outcome 2"]}},
    "bonus_ideas": ["High-value bonus 1", "High-value bonus 2"],
    "cta_sentence": "Professional, low-friction call to action.",
    "promises": ["Core benefit 1", "Core benefit 2", "Core benefit 3"]
  }}
]
```
Return ONLY the JSON. Align with 'Perfect Webinar' framework. Tone: Professional, authoritative, and Norwegian-market friendly (even in English).
"""


CONCEPT_EVALUATION_PROMPT = """
# Self-Evaluation Prompt
*(AI shall evaluate the three webinar concepts critically and professionally)*

### Assessment Prompt:
**Task:**
Evaluate the three webinar concepts critically and professionally. Be direct, concrete, and mature in your assessments.

**CONCEPTS:**
{concepts}

Use the following evaluation criteria:
1. **Market Fit:**
    – Is the language, style, and angle adapted to the target audience?
    – Is anything too pushy or "hype-y"?
2. **Big Idea Quality:**
    – Is the Big Idea clear enough to carry an entire webinar?
    – Is it strong enough to drive a purchase?
3. **Hook Strength:**
    – Are the hooks distinct, concrete, and emotionally resonant?
4. **Secret Structure:**
    – Do the secrets actually break vehicle, internal, and external beliefs?
    – Are they logical, credible, and relevant?
5. **Mechanism:**
    – Is the mechanism clearly formulated?
    – Is it clear *why* this program works when others fail?
6. **Concreteness:**
    – Are the concepts specific and not generic?
    – Can the target audience see themselves in the webinar?
7. **Structure:**
    – Does the concept follow Perfect Webinar + GOAT (structure, dramaturgy, progression)?
8. **Conversion Potential:**
    – Which of the three concepts has the best sales potential – and why?
    – What weaknesses might hinder conversion?

Provide:
- A summary assessment
- A detailed assessment of each concept
- A list of improvement points that should be included in the next version
"""

CONCEPT_IMPROVEMENT_PROMPT = """
# Implementation Prompt
*(AI shall use findings from the assessment to improve the concepts)*

### Integration Prompt:
**Task:**
Use all findings and improvement points from the assessment to generate **three new and improved webinar concepts**.

**ORIGINAL CONCEPTS:**
{concepts}

**EVALUATION:**
{evaluation}

Requirements:
- Implement all critical findings directly into the new concepts
- Remove anything evaluated as weak, unclear, or off-target
- Do not repeat anything that was criticized
- Strengthen what was evaluated as strong
- Make the concepts more concrete and precise for the target audience
- The structure must be identical to the concept prompt (no changed layout)
- Output must be three distinct, mature, clear, and high-converting webinar concepts
- All three must be improved versions of the originals, not new directions
"""
