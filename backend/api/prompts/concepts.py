# NORWEGIAN PROMPTS (COMMENTED OUT)
# CONCEPT_GENERATION_PROMPT = """
# # PERFECT WEBINAR CONCEPT PROMPT
# ... (Norwegian content hidden) ...
# """

# ENGLISH PROMPTS (ACTIVE)

CONCEPT_GENERATION_PROMPT = """
# PERFECT WEBINAR CONCEPT PROMPT
*(English Version for Change20)*

**Task:**
You must develop **three complete webinar concepts** based on:
- The Mentor's Onboarding Document *(provided below)*
- The Hook Analysis from Creative Scale *(provided below)*
- All project context and frameworks (Perfect Webinar + GOAT Webinars + storyselling + false beliefs + mechanism etc.)

Do not reproduce or paste these documents. Use them as the foundation.

---
## INPUT
Use **exclusively** information from the attached documents:
- Mentor's Onboarding Document
- Hook Analysis

No manual input fields. No variables. No extra questions.
All necessary information must be extracted directly from the documents.

**ONBOARDING DOCUMENT:**
{onboarding_doc}

**HOOK ANALYSIS:**
{hook_analysis}

---
# OUTPUT FORMAT - CRITICAL
You MUST return EXACTLY a JSON array with 3 concept objects. Each object must have these exact fields:

```json
[
  {{
    "title": "Curiosity-driven title",
    "big_idea": "If they believe this one thing, they must buy",
    "hook": "3-5 hooks based on target audience",
    "structure_points": ["Hook & Intro", "Origin Story", "The One Thing", "3 Secrets", "Mechanism", "Transition to Offer", "Offer Structure", "Q&A"],
    "secrets": [
      {{"assumption": "False belief about vehicle", "story": "Story that breaks it", "belief": "New belief", "transformation": "Small transformation"}},
      {{"assumption": "False belief about internal", "story": "Story that breaks it", "belief": "New belief", "transformation": "Small transformation"}},
      {{"assumption": "False belief about external", "story": "Story that breaks it", "belief": "New belief", "transformation": "Small transformation"}}
    ],
    "mechanism": "How the program works when everything else fails",
    "value_anchor": {{"outcomes": ["Learning outcome 1", "Learning outcome 2", "Learning outcome 3"]}},
    "bonus_ideas": ["Bonus 1", "Bonus 2"],
    "cta_sentence": "Warm, safe, clear call to action",
    "promises": ["Promise 1", "Promise 2", "Promise 3"]
  }}
]
```

Return ONLY the JSON array, no markdown formatting, no explanations before or after.
Each of the 3 concepts must be clearly differentiated, story-based, and aligned with Perfect Webinar framework.
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
