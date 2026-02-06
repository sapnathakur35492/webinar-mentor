import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def verify_pipeline():
    print("--- Verifying Change 2.0 Pipeline ---")
    
    # 1. Test Service Initialization
    from api.services.webinar_ai import WebinarAIService
    service = WebinarAIService()
    print("Service initialized.")
    
    # 2. Test Model Compatibility
    from api.models import Concept
    try:
        concept = Concept(
            title="Test",
            big_idea="Test idea",
            hook="Test hook",
            structure_points=["P1"],
            secrets=[{"assumption": "A", "story": "S", "belief": "B", "transformation": "T"}],
            mechanism="Test mechanism",
            narrative_angle="Test angle",
            offer_transition_logic="Test logic",
            value_anchor={"outcomes": ["O"]},
            bonus_ideas=["B1"],
            cta_sentence="CTA",
            promises=["P1"]
        )
        print("Concept model is compatible with new fields.")
    except Exception as e:
        print(f"Model compatibility error: {e}")
        return

    # 3. Test Prompt Loading
    from api.prompts.concepts_v2 import CONCEPT_GENERATION_PROMPT
    from api.prompts.structure_v2 import STRUCTURE_GENERATION_PROMPT
    
    if "narrative_angle" in CONCEPT_GENERATION_PROMPT:
        print("concepts_v2 prompt loaded correctly.")
    else:
        print("ERROR: concepts_v2 prompt missing narrative_angle.")
        
    if "80–110 slides" in STRUCTURE_GENERATION_PROMPT:
        print("structure_v2 prompt loaded correctly.")
    else:
        print("ERROR: structure_v2 prompt missing slide count requirements.")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    asyncio.run(verify_pipeline())
