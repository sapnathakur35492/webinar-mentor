# NORWEGIAN PROMPTS (COMMENTED OUT)
# CONCEPT_TRANSCRIPT_UPDATE_PROMPT = ...

# ENGLISH PROMPTS (ACTIVE)

CONCEPT_TRANSCRIPT_UPDATE_PROMPT = """
# Prompt for Implementing Changes from Mentor (Change 2.0 Standard)
*(Paste when meeting minutes/transcript available)*

**Task:**
Improve and update the webinar concept based on the meeting transcript with the mentor. 
The transcript is the primary source; align the concept strictly with the mentor's feedback.

**INPUT:**
**LATEST CONCEPT:**
{current_concept}

**MEETING TRANSCRIPT:**
{transcript}

**Instructions:**
- Analyze the meeting content for changes in Big Idea, Hooks, Secrets, and Mechanism.
- **CRITICAL**: Update the **Narrative Angle** and **Offer Transition Logic** based on the mentor's input.
- Remove any elements the mentor did not resonate with.
- Strengthen everything the mentor explicitly liked.
- Ensure the tone remains professional and Norwegian-market friendly.
- Maintain the standardized JSON structure for the final output.

**OUTPUT:**
– One finished, revised webinar concept (JSON)
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
