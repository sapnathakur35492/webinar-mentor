# NORWEGIAN PROMPTS (COMMENTED OUT)
# EMAIL_PLAN_PROMPT = ...

# ENGLISH PROMPTS (ACTIVE)

EMAIL_PLAN_PROMPT = """
# Prompt for Creating Email Sequence Overview

**Task:**
Create a complete email sequence based on:
1. How long we advertise the webinar
2. What we are selling
3. How long open cart lasts (from sales open to close)
4. Max registration lead time
5. The finished webinar concept and outline

---
## INPUT
**CONCEPT & STRUCTURE:**
{concept_structure}

**PRODUCT DETAILS:**
{product_details}

---
## INSTRUCTIONS
You shall generate **one compiled email plan** covering the entire run:
1. **Pre-Webinar:** Confirm, build anticipation, warm up.
2. **Right Before Webinar:** Reminders.
3. **Post-Webinar:** Two tracks (Attended / Did Not Attend).
4. **Sales and Open Cart:** Dramaturgy building understanding → safety → decision.
5. **Tone:** Professional, calm, mature.

---
## OUTPUT FORMAT
Provide a structured plan in a JSON-friendly format (but as text):

# PART 1: Overall Plan
- Days, segments, number of emails.

# PART 2: Full Email Sequence (Sverview)
For each email:
**Email X**
- Segment: [who]
- Timing: [D-3, D+1 etc]
- Purpose: [...]
- Core Message: [...]
- CTA: [...]
- Tone: [...]

# PART 3: Recommended Dramaturgy
Short explanation.
"""

EMAIL_GENERATION_PROMPT = """
# PROMPT FOR PRODUCING ONE EMAIL

**Task:**
Based on the email outline for this specific email, write a finished email with a clear, calm, and professional tone.

**INPUT:**
**OUTLINE:**
{email_outline}

**CONCEPT:**
{concept_context}

**Instructions:**
- Follow the outline exactly
- Be concrete and relevant for the segment
- Market fit (no hype)
- Keep the tone warm, safe, concrete, and mature
- End with one clear CTA
"""

EMAIL_SELF_EVALUATION_PROMPT = """
# Email Self-Evaluation Prompt
*(AI shall evaluate the email sequence critically)*

**Task:**
Assess the email strictly and professionally.
Role: David Ogilvy + Alex Hormozi + Norwegian Conversion Strategist.

**INPUT:**
**EMAIL DRAFT:**
{email_text}

**CRITERIA:**
1. Clarity & Relevance
2. Hook & Opening quality
3. "Norwegian Tone" (No hype, safe, mature)
4. CTA Strength (Frictionless?)

**OUTPUT:**
Provide a JSON object with:
- score (1-10)
- critique_summary (string)
- improvement_points (List[str] - 7 concrete actions)
"""

EMAIL_EVALUATION_IMPLEMENTATION_PROMPT = """
# Email Implementation Prompt
*(AI shall improve the emails based on evaluation)*

**Task:**
Rewrite the email based on the self-evaluation.

**INPUT:**
**Original Draft:**
{email_text}

**Evaluation Requirements:**
{evaluation}

**INSTRUCTIONS:**
- Implement all 7 improvement points.
- Remove identified weaknesses.
- MAINTAIN the "Norwegian Market Tone" (Calm, Professional, No Hype).
- Ensure the CTA is clear.

Output the final improved email text.
"""
