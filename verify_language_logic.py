
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.api.services.webinar_ai import WebinarAIService
from backend.api.models import WebinarAsset, Mentor
from backend.api.prompts.system_prompts import WEBINAR_MASTER_OS_PROMPT_ENGLISH, WEBINAR_MASTER_OS_PROMPT_NORWEGIAN

async def test_language_logic():
    print("--- Testing Language Logic ---")
    service = WebinarAIService()
    
    # Mock Models
    user_id = "test_user_english"
    asset_id = "test_asset_english"
    
    # Mock Asset
    asset_eng = WebinarAsset(
        id=asset_id,
        mentor_id=user_id,
        onboarding_doc_content="English Doc",
        created_at="2024-01-01T00:00:00"
    )
    
    # Mock Mentor (English)
    mentor_eng = Mentor(
        user_id=user_id,
        id="mentor_eng_id",
        email="test@example.com",
        full_name="Test English",
        language_tone="English"
    )
    
    # Mock Mentor (Norwegian)
    user_id_nor = "test_user_nor"
    asset_id_nor = "test_asset_nor"
    asset_nor = WebinarAsset(
        id=asset_id_nor,
        mentor_id=user_id_nor,
        onboarding_doc_content="Norsk Doc",
        created_at="2024-01-01T00:00:00"
    )
    mentor_nor = Mentor(
        user_id=user_id_nor,
        id="mentor_nor_id",
        email="nor@example.com",
        full_name="Test Norwegian",
        language_tone="Norwegian"
    )
    
    # Monkey patch find_one/get because we don't have DB connection here easily without async loop
    # But wait, WebinarAIService._get_language_context calls `await Mentor.find_one(...)`.
    # I can mock the class method or just mock the call.
    
    # Actually, I can just create a patched version of _get_language_context OR mock the DB call.
    # It's easier to mock the DB call if I can. Beanie uses `await Mentor.find_one(...)`.
    
    # Simpler: Modify `_get_language_context` temporarily or mock Mentor.find_one.
    
    # Let's use `unittest.mock`.
    from unittest.mock import MagicMock, AsyncMock, patch
    
    with patch('backend.api.models.Mentor.find_one') as mock_find_one:
        # Test English
        mock_find_one.return_value = mentor_eng
        context_eng = await service._get_language_context(asset_eng)
        print(f"English Context Language: {context_eng['language']}")
        print(f"English System Prompt Match: {context_eng['system_prompt'] == WEBINAR_MASTER_OS_PROMPT_ENGLISH}")
        
        if context_eng['language'] == "English" and context_eng['system_prompt'] == WEBINAR_MASTER_OS_PROMPT_ENGLISH:
            print("PASS: English Logic Correct")
        else:
            print("FAIL: English Logic Incorrect")

        # Test Norwegian
        mock_find_one.return_value = mentor_nor
        context_nor = await service._get_language_context(asset_nor)
        print(f"Norwegian Context Language: {context_nor['language']}")
        print(f"Norwegian System Prompt Match: {context_nor['system_prompt'] == WEBINAR_MASTER_OS_PROMPT_NORWEGIAN}")
        
        if context_nor['language'] == "Norwegian (Bokmål)" and context_nor['system_prompt'] == WEBINAR_MASTER_OS_PROMPT_NORWEGIAN:
            print("PASS: Norwegian Logic Correct")
        else:
            print("FAIL: Norwegian Logic Incorrect")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test_language_logic())
