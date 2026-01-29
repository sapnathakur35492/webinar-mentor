# NORWEGIAN PROMPTS (COMMENTED OUT)
# STRUCTURE_GENERATION_PROMPT = ...

# ENGLISH PROMPTS (ACTIVE)

STRUCTURE_GENERATION_PROMPT = """
# Prompt: Slide-by-slide Outline Based on Final Webinar Concept

**Task:**
Create a complete slide-by-slide outline based on the final webinar concept.
The structure must be professional, fluid, and dramatically strong, in line with Perfect Webinar + GOAT Webinars.

**Do not write a script.**
Only a clear, precise, and logically built *outline*.

---
## INPUT
**CONCEPT:**
{concept}

---
## INSTRUCTIONS
You shall:
- Follow the structure from Perfect Webinar + GOAT Webinars
- Create clear sections (Intro, The One Thing, Secret 1–3, Bridge, Pitch, Q&A)
- Create **80–110 slides**, depending on what provides the most natural flow
- Specify **slide by slide** what each slide contains
- Give each slide:
    - A clear title
    - A short description of the message
    - Any visual recommendations (only when relevant)
- Create natural transitions between sections
- Maintain dramaturgy, rhythm, and variation
- Ensure market fit (no hype)
- Base everything on the concept – do not add new ideas that are not there

---
## OUTPUT FORMAT
The structure must be delivered like this:

# PART 1: INTRO / HOOK (Slides X–Y)
**1. [Slide Title]**
Short description of content and intention.
**2. [Slide Title]**
Short description.
...

# PART 2: THE ONE THING (Slides X–Y)
...
# PART 3: SECRET 1 (Slides X–Y)
...
# PART 4: SECRET 2 (Slides X–Y)
...
# PART 5: SECRET 3 (Slides X–Y)
...
# PART 6: BRIDGE TO OFFER (Slides X–Y)
...
# PART 7: PITCH (Slides X–Y)
...
# PART 8: Q&A (Slides X–Y)
...

## DELIVERY
A complete, coherent, and educational slide-by-slide outline that can be used directly to build the Google Slides or Keynote presentation.
"""

STRUCTURE_EVALUATION_PROMPT = """
# Structure Self-Evaluation Prompt
*(AI shall evaluate the webinar structure critically)*

**Task:**
Evaluate the generated slide-by-slide structure.

**Criteria:**
1. Dramaturgy: Does it follow the Perfect Webinar arc?
2. Flow: Are transitions natural?
3. Clarity: Is each slide's purpose clear?
4. Market Fit: Is it too salesy or too academic?
5. Content depth: Are the secrets actually breaking beliefs?

For the overall structure, provide:
- Score (1-10)
- Strengths
- Weaknesses
- Specific improvement instructions for the next version.

Output as JSON.
"""

STRUCTURE_IMPROVEMENT_PROMPT = """
# Structure Implementation Prompt
*(AI shall improve the structure based on evaluation)*

**Task:**
Rewrite the webianr structure based on the self-evaluation.

**INPUT:**
**ORIGINAL STRUCTURE:**
{structure}

**EVALUATION:**
{evaluation}

**INSTRUCTIONS:**
- Keep the format (Part 1, Part 2...).
- Implement all improvement instructions.
- Fix identified weaknesses.
- Ensure the result is a polished, ready-to-use outline (80-110 slides).

Output the full improved text.
"""
