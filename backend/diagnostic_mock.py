import asyncio
import sys
import os

# Add backend to path for imports
sys.path.append(os.path.abspath("."))

from api.services.webinar_ai import webinar_ai_service

async def test_mock():
    print("Testing WebinarAIService Mock Response...")
    try:
        # Get mock concepts response
        mock_resp = webinar_ai_service._get_mock_response("Diagnostic Test")
        print("\n--- Mock Response Structure ---")
        import json
        print(json.dumps(mock_resp, indent=2))
        
        # Get actual mock concepts
        mock_concepts = webinar_ai_service._get_mock_concepts()
        print("\n--- First Mock Concept Big Idea ---")
        if mock_concepts:
            concept = mock_concepts[0]
            print(concept.big_idea)
        else:
            print("No mock concepts returned by _get_mock_concepts()")
            
    except Exception as e:
        print(f"Error during diagnostic: {e}")

if __name__ == "__main__":
    asyncio.run(test_mock())
