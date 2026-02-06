# Professional Email Sequence Generation (Change 2.0 Standard)

EMAIL_STRATEGY_PROMPT = """
# Email Strategy & Sequence Overview (Change 2.0)

**Role:**
You are a world-class webinar marketing strategist specializing in the Norwegian market.

**Goal:**
Design a comprehensive email sequence for a professional webinar.

**Context:**
Webinar Concept: {concept}
Slide Structure: {structure}

**Norwegian Market Guardrails:**
- Tone: Professional, authoritative, yet approachable.
- No "American Hype": Avoid "Last chance!", "Don't miss out!!!", or overly aggressive scarcity.
- Trust-based: Focus on the value and the "logic-induction" (helping them see why they need this).

**Sequence Requirements:**
1. **Pre-Webinar (3-4 mails):**
   - Invitation (The "Big Idea" & Transformation).
   - Logic-Induction (Educational piece proving the "Unique Mechanism").
   - Reminder (24h before: Logistics & expectation setting).
   - Final Reminder (1h before: "Starting soon" with link).

2. **Post-Webinar - Attendees (3-4 mails):**
   - Thank You & Replay (Summary of the "Aha!" moments).
   - Objection Handling (Logic-based breakdown of common hesitations).
   - Transformation Proof (Case study or logic dive into the Secret Structure).
   - Soft Close (Professional enrollment deadline).

3. **Post-Webinar - No-Shows (2-3 mails):**
   - "Missed You" & Replay access.
   - The "One Thing" they missed (Core mechanism summary).
   - Final Opportunity (Logic-induction for why they should watch before it's gone).

**Output Format (JSON):**
Deliver a structured overview of the sequence.
```json
{{
  "strategy": "Overall communication logic",
  "sequence": [
    {{
      "id": "pre_1",
      "type": "pre_webinar",
      "timing": "At registration",
      "goal": "Confirmation & Big Idea excitement",
      "logic": "Why this mail matters"
    }}
  ]
}}
```
"""

EMAIL_GENERATION_PROMPT = """
# Email Copy Generation (Change 2.0)

**Task:**
Generate the full professional English copy for the email sequence based on the strategy.

**Strategy:**
{strategy}

**Content Requirements per Email:**
- **Subject Line:** Curiosity-driven, professional (not clickbaity).
- **Preview Text:** A short teaser sentence (hidden/preheader) that appears in the inbox.
- **Opening:** High-relevance, personal hook.
- **Body:** Professional paragraphs (no bullet point lists only). Explain the logic.
- **CTA:** Logical next step (e.g., "Set your calendar", "Watch the replay").
- **Signature:** Professional sign-off.

**Tone:**
Norwegian-market friendly. Authoritative. Calm. Logical.

**Output Format (JSON Array):**
```json
[
  {{
    "id": "pre_1",
    "type": "pre_webinar",
    "goal": "Invitation",
    "subject": "...",
    "preview_text": "...",
    "body": "Full multi-paragraph text",
    "cta": "Link text",
    "timing": "..."
  }}
]
```
"""

EMAIL_EVALUATION_PROMPT = """
# Email Self-Evaluation (Change 2.0)

**Criteria:**
1. **Authenticity**: Does it sound like a real professional, or an AI sales bot?
2. **Logic-Induction**: Does the copy actually teach/prove the mechanism?
3. **Tone**: Is it calm and authoritative (Norwegian style) or hypey?
4. **Transition**: Is the move from education to the call-to-action natural?

Output JSON with:
- `score`: (1-10)
- `positives`: list
- `improvements`: specific instructions for the next draft.
"""

EMAIL_IMPROVEMENT_PROMPT = """
# Email Refinement (Change 2.0)

Improve the email copy based on the evaluation. Focus on deepening the professional narrative and stripping away any lingering marketing clichés.

**Original:**
{emails}

**Evaluation:**
{evaluation}

**Output:**
JSON array of improved emails.
"""
