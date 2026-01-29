# NORWEGIAN PROMPTS (COMMENTED OUT)
# CONCEPT_TRANSCRIPT_UPDATE_PROMPT = ...

# ENGLISH PROMPTS (ACTIVE)

CONCEPT_TRANSCRIPT_UPDATE_PROMPT = """
# Prompt for Implementing Changes from Mentor
*(Paste when meeting minutes/transcript available)*

**Task:**
You shall improve and update the webinar concept based on the content of the meeting transcript from the mentor. Use the transcript as the most important source for changes, and keep only what is actually supported by the meeting.

**INPUT:**
**LATEST CONCEPT:**
{current_concept}

**MEETING TRANSCRIPT:**
{transcript}

**Instructions:**
- Analyze the meeting content and identify all relevant changes.
- Remove anything in the concept that the mentor did not resonate with.
- Strengthen everything the mentor liked.
- Implement concrete feedback on Big Idea, Hooks, Secrets, Mechanism, Tone.
- All changes must be explicitly linked to the meeting discussion.
- Deliver a **finished, optimized webinar concept**.

**OUTPUT:**
– One finished, revised webinar concept
– Short list of what changes were made
"""

STRUCTURE_TRANSCRIPT_UPDATE_PROMPT = """
# Prompt: Updated Slide-by-slide Outline Based on Transcript

**Task:**
Use the meeting transcript and the final webinar concept to generate a completely updated slide-by-slide outline.

**INPUT:**
**FINAL CONCEPT:**
{final_concept}

**MEETING TRANSCRIPT:**
{transcript}

**Instructions:**
- Analyze the meeting for changes in Big Idea, Stories, Secrets, Tonality.
- Produce a **complete slide-by-slide outline (80–110 slides)**.
- Update *everything* changed by the meeting.
- Market fit.

**OUTPUT FORMAT:**
(Same structure as original outline: Part 1..8)
"""
