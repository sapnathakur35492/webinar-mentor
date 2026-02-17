import os
import sys
from fastapi import HTTPException
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

load_dotenv(override=True)

from api.services.heygen_service import heygen_service

def test_webinar_logic():
    print("Testing webinar router logic simulation...")
    
    # Simulate the router logic
    try:
        # Force an error by passing garbage arguments
        print("Calling safe_generate_video with INVALID arguments...")
        result = heygen_service.safe_generate_video(
            script_text="", # Invalid empty text
            image_path=None,
            gender="unknown_gender"
        )
        print(f"Result from service: {result}")
        
        # Simulate router check
        if result.get("status") == "error":
            error_msg = result.get("error") or result.get("detail") or "Unknown heygen error"
            print(f"[WebinarRouter] CAUGHT ERROR: {error_msg}")
            # Raise exception like router would
            raise HTTPException(status_code=400, detail=error_msg)
        else:
            print("[WebinarRouter] SUCCESS (Unexpected!)")
            
    except HTTPException as e:
        print(f"Caught Expected HTTPException: {e.detail}")
    except Exception as e:
        print(f"Caught Unexpected Exception: {e}")

if __name__ == "__main__":
    test_webinar_logic()
