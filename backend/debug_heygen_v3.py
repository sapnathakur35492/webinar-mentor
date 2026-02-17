import os
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from api.services.heygen_service import heygen_service

load_dotenv(override=True)

def test_generate():
    print("Testing HeyGen Video Generation...")
    
    script_text = "Hello, I am testing the new voice gender feature. This should use a female Norwegian voice."
    
    # Force fallback by passing None
    print("Testing with image_path=None (Fallback to DORA) and gender='male'")
    
    try:
        # Use male gender, no image
        result = heygen_service.generate_video(
            script_text=script_text,
            image_path=None,
            gender="male",
            use_avatar_iv_model=False 
        )
        print("SUCCESS:", result)
    except Exception as e:
        print("FAILED:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generate()
