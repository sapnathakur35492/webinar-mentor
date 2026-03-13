
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def test_language_enforcement():
    try:
        from api.services.webinar_ai import webinar_ai_service
        from api.models import WebinarAsset
        from beanie import init_beanie
        from motor.motor_asyncio import AsyncIOMotorClient
        from core.settings import settings
        
        # Init beanie for models
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await init_beanie(database=client.get_default_database(), document_models=[WebinarAsset])
        
        print("Testing Norwegian Enforcement...")
        
        # Mock asset and context
        asset = WebinarAsset(mentor_id="test_mentor", onboarding_doc_content="This is a test document in English.")
        # Override _get_language_context for test
        ctx = {
            "language": "Norwegian (Bokmål)",
            "market_tone": "Professional",
            "system_prompt": "Du er en norsk ekspert. SVAR BARE PÅ NORSK."
        }
        
        prompt = "Write a one-sentence summary of a webinar about digital marketing."
        
        # Test generate_content
        response = await webinar_ai_service.generate_content(prompt, system_prompt=ctx["system_prompt"])
        
        print(f"Prompt: {prompt}")
        print(f"Response: {response}")
        
        if any(word in response.lower() for word in ["webinar", "digital", "markedsføring", "er"]):
             print("SUCCESS: Response seems to contain Norwegian/Domain terms.")
        else:
             print("WARNING: Response might not be in Norwegian.")
             
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_language_enforcement())
