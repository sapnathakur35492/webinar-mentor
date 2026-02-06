# ENGLISH PROMPTS (STANDARD V2)

STRUCTURE_GENERATION_PROMPT = """
# Prompt: Strategic Slide-by-slide Outline (Change 2.0 Standard)

**Task:**
Create a complete slide-by-slide outline based on the final approved webinar concept.
The structure must follow the **Perfect Webinar** + **GOAT Webinars** psychology.

**Target length:** 80–110 slides.

---
## INPUT
**APPROVED CONCEPT:**
{concept}

---
## INSTRUCTIONS
You shall:
- Follow the structure: **Intro → The One Thing → Secret 1–3 → Bridge → Pitch → Q&A**.
- Maintain the **Norwegian market tone**: Professional, educational, trustworthy, and devoid of hype.
- Specify **slide by slide** what each slide contains.
- For each slide provide:
    - **Title**: Clear and educational.
    - **Description**: Precise message/purpose of the slide.
    - **Visual Recommendation**: (Optional) Layout or image ideas.

---
## REQUIRED STRUCTURE FLOW:
1. **PART 1: INTRO / HOOK (Slides 1–15)**: Set the stage, state the mission, handle the "Who am I?".
2. **PART 2: THE ONE THING (Slides 16–25)**: Core transformation and unique mechanism introduction.
3. **PART 3: SECRET 1 (Slides 26–40)**: Breaking the vehicle belief with a powerful story.
4. **PART 4: SECRET 2 (Slides 41–55)**: Breaking the internal belief (I can't do this).
5. **PART 5: SECRET 3 (Slides 56–70)**: Breaking the external belief (I don't have time/money/etc).
6. **PART 6: BRIDGE TO OFFER (Slides 71–80)**: Smooth transition from education to transformation.
7. **PART 7: PITCH / STACK (Slides 81–100)**: The offer components, bonuses, and value stacking.
8. **PART 8: Q&A / OBJECTION HANDLING (Slides 101–110)**: Answering questions and reinforcing the new beliefs.

## OUTPUT FORMAT
Deliver a clear text-based outline organized by the Parts above.
"""

STRUCTURE_EVALUATION_PROMPT = """
# Structure Self-Evaluation Prompt (Change 2.0)

**Task:**
Critically evaluate the 80–110 slide webinar structure.

**Criteria:**
1. **Dramaturgy**: Does it follow the Perfect Webinar arc?
2. **Pacing**: Is the slide count appropriate for each section?
3. **Tone**: Is it professional and Norwegian-market friendly?
4. **Logic**: Do the stories in the secrets actually prove the new beliefs?
5. **Offer Transition**: Is the transition from learning to buying natural?

Output a JSON with:
- `score`: (1-10)
- `strengths`: list
- `weaknesses`: list
- `improvement_steps`: specific instructions for the next draft.
"""

STRUCTURE_IMPROVEMENT_PROMPT = """
# Structure Implementation Prompt (Change 2.0)

**Task:**
Rewrite and polish the slide-by-slide structure based on the evaluation findings.

**ORIGINAL STRUCTURE:**
{structure}

**EVALUATION:**
{evaluation}

**Requirements:**
- Implement all improvements.
- Ensure the final count is 80–110 slides.
- Guarantee the tone is consistently professional and non-hyped.
- Ensure transitions between "Parts" are seamless.
"""
