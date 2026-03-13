# ENGLISH PROMPTS (STANDARD V2)

CONCEPT_GENERATION_PROMPT = """
# PROFESSIONAL WEBINAR CONCEPT GENERATION (CHANGE 2.0 STANDARD)

**Task:**
Develop **EXACTLY THREE (3) elite webinar concepts** based on the provided onboarding documents and hook analysis. 
These concepts must be high-converting, deeply structured, and ready for automation.

**CRITICAL REQUIREMENTS:**
- LANGUAGE: You MUST write in {language} only. Every single word must be in {language}.
- You MUST return EXACTLY 3 concepts in a JSON array. Not 1, not 2. EXACTLY 3.
- You MUST write every section as **FULL, PROFESSIONAL PARAGRAPHS**.
- NO bullet points. NO short fragments.
- TONE: Professional, authoritative, and {market_tone}.
- Minimum 2-3 detailed paragraphs for "big_idea" and "mechanism".
- Each "story" in the secret structure must be at least 3 detailed paragraphs long, containing a clear setup, conflict, and resolution.
- Each concept must have 3 secrets/belief shifts.

---
## INPUT DATA
**ONBOARDING DOCUMENT:**
{onboarding_doc}

**HOOK ANALYSIS:**
{hook_analysis}

---
# OUTPUT FORMAT - JSON ARRAY WITH EXACTLY 3 CONCEPTS
You MUST return ONLY a valid JSON array containing exactly 3 concept objects. No markdown, no explanation, no text before or after the JSON.

```json
[
  {{
    "title": "Professional curiosity-driven title for Concept 1",
    "big_idea": "A 2-3 paragraph explanation of the core transformation and 'The One Thing'.",
    "hook": "High-converting opening narrative hook.",
    "structure_points": ["Hook", "Story", "Secrets", "Mechanism", "Offer"],
    "secrets": [
      {{
        "assumption": "False belief (1 paragraph)",
        "belief": "New empowering truth (1 paragraph)",
        "story": "A multi-paragraph (3+) detailed story breaking the old assumption (Perfect Webinar style).",
        "transformation": "The internal psychological shift (1 paragraph)"
      }},
      {{
        "assumption": "Second false belief (1 paragraph)",
        "belief": "Second new truth (1 paragraph)",
        "story": "Another multi-paragraph (3+) story.",
        "transformation": "The second shift (1 paragraph)"
      }},
      {{
        "assumption": "Third false belief (1 paragraph)",
        "belief": "Third new truth (1 paragraph)",
        "story": "Third multi-paragraph (3+) story.",
        "transformation": "The third shift (1 paragraph)"
      }}
    ],
    "mechanism": "A 2-3 paragraph technical explanation of why your method works when others fail (The Unique Mechanism).",
    "narrative_angle": "A detailed explanation of the narrative framing and angle used for this concept (1-2 paragraphs).",
    "offer_transition_logic": "Deeply structured logic on how the teaching naturally leads to the offer (1-2 paragraphs).",
    "value_anchor": {{"outcomes": ["Detailed outcome 1", "Detailed outcome 2"]}},
    "bonus_ideas": ["High-value bonus 1", "High-value bonus 2"],
    "cta_sentence": "Professional, low-friction call to action.",
    "promises": ["Core benefit 1", "Core benefit 2", "Core benefit 3"]
  }},
  {{
    "title": "Professional curiosity-driven title for Concept 2 (DIFFERENT angle from Concept 1)",
    "big_idea": "...",
    "hook": "...",
    "structure_points": ["..."],
    "secrets": [
      {{"assumption": "...", "belief": "...", "story": "...", "transformation": "..."}},
      {{"assumption": "...", "belief": "...", "story": "...", "transformation": "..."}},
      {{"assumption": "...", "belief": "...", "story": "...", "transformation": "..."}}
    ],
    "mechanism": "...",
    "narrative_angle": "...",
    "offer_transition_logic": "...",
    "value_anchor": {{"outcomes": ["..."]}},
    "bonus_ideas": ["..."],
    "cta_sentence": "...",
    "promises": ["..."]
  }},
  {{
    "title": "Professional curiosity-driven title for Concept 3 (DIFFERENT angle from Concepts 1 and 2)",
    "big_idea": "...",
    "hook": "...",
    "structure_points": ["..."],
    "secrets": [
      {{"assumption": "...", "belief": "...", "story": "...", "transformation": "..."}},
      {{"assumption": "...", "belief": "...", "story": "...", "transformation": "..."}},
      {{"assumption": "...", "belief": "...", "story": "...", "transformation": "..."}}
    ],
    "mechanism": "...",
    "narrative_angle": "...",
    "offer_transition_logic": "...",
    "value_anchor": {{"outcomes": ["..."]}},
    "bonus_ideas": ["..."],
    "cta_sentence": "...",
    "promises": ["..."]
  }}
]
```
Return ONLY the JSON array with exactly 3 concepts. No text before or after. Align with 'Perfect Webinar' + 'GOAT' frameworks.
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
3. **Secret Structure:** Do the stories effectively shift beliefs (Perfect Webinar style)? Are there exactly 3 secrets per concept?
4. **Mechanism:** Is the unique mechanism compelling and logical?
5. **Narrative Angle:** Is the angle distinct and resonant?
6. **Offer Transition:** Is the logic from value to pitch seamless and non-pushy?

Provide:
- A summary assessment
- A detailed assessment of each concept
- A list of specific improvement instructions.
"""

CONCEPT_IMPROVEMENT_PROMPT = """
# Concept Improvement Prompt (Change 2.0)

**Task:**
Improve the three webinar concepts based on the evaluation findings.
You MUST return EXACTLY 3 improved concepts as a valid JSON array.

**ORIGINAL CONCEPTS:**
{concepts}

**EVALUATION:**
{evaluation}

**Requirements:**
- Implement all improvements directly.
- LANGUAGE: You MUST write in {language} only. Every single word must be in {language}.
- Return EXACTLY 3 concepts in a JSON array - same format as below.
- Each concept MUST have exactly 3 secrets/belief shifts.
- Ensure all paragraphs remain detailed and professional.
- Strengthen the "Unique Mechanism" and "Offer Transition Logic".
- TONE: {market_tone}.

**OUTPUT FORMAT - RETURN ONLY THIS JSON ARRAY (no text before or after):**
```json
[
  {{
    "title": "Improved title for Concept 1",
    "big_idea": "Improved 2-3 paragraph big idea",
    "hook": "Improved hook",
    "structure_points": ["Hook", "Story", "Secrets", "Mechanism", "Offer"],
    "secrets": [
      {{"assumption": "...", "belief": "...", "story": "3+ paragraph story", "transformation": "..."}},
      {{"assumption": "...", "belief": "...", "story": "3+ paragraph story", "transformation": "..."}},
      {{"assumption": "...", "belief": "...", "story": "3+ paragraph story", "transformation": "..."}}
    ],
    "mechanism": "Improved 2-3 paragraph mechanism",
    "narrative_angle": "Improved narrative angle (1-2 paragraphs)",
    "offer_transition_logic": "Improved offer transition (1-2 paragraphs)",
    "value_anchor": {{"outcomes": ["Outcome 1", "Outcome 2"]}},
    "bonus_ideas": ["Bonus 1", "Bonus 2"],
    "cta_sentence": "Improved CTA",
    "promises": ["Promise 1", "Promise 2", "Promise 3"]
  }},
  {{
    "title": "Improved title for Concept 2",
    "big_idea": "...",
    "hook": "...",
    "structure_points": ["..."],
    "secrets": [{{"assumption":"...","belief":"...","story":"...","transformation":"..."}},{{"assumption":"...","belief":"...","story":"...","transformation":"..."}},{{"assumption":"...","belief":"...","story":"...","transformation":"..."}}],
    "mechanism": "...",
    "narrative_angle": "...",
    "offer_transition_logic": "...",
    "value_anchor": {{"outcomes": ["..."]}},
    "bonus_ideas": ["..."],
    "cta_sentence": "...",
    "promises": ["..."]
  }},
  {{
    "title": "Improved title for Concept 3",
    "big_idea": "...",
    "hook": "...",
    "structure_points": ["..."],
    "secrets": [{{"assumption":"...","belief":"...","story":"...","transformation":"..."}},{{"assumption":"...","belief":"...","story":"...","transformation":"..."}},{{"assumption":"...","belief":"...","story":"...","transformation":"..."}}],
    "mechanism": "...",
    "narrative_angle": "...",
    "offer_transition_logic": "...",
    "value_anchor": {{"outcomes": ["..."]}},
    "bonus_ideas": ["..."],
    "cta_sentence": "...",
    "promises": ["..."]
  }}
]
```
Return ONLY the JSON array. No markdown code fences, no explanation text. Just the raw JSON array starting with [ and ending with ].
"""
