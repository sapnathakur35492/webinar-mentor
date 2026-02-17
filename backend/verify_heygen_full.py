import os
import sys
import requests
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

load_dotenv(override=True)

from api.services.heygen_service import heygen_service
from core.settings import settings

def print_result(name, passed, msg=""):
    symbol = "✅" if passed else "❌"
    print(f"{symbol} {name}: {msg}")

def verify_system():
    print("--- 🔍 SARTING FULL SYSTEM VERIFICATION ---")
    
    # 1. Check Env Config
    provider = os.getenv("DEFAULT_VIDEO_PROVIDER", "").lower()
    print_result("Provider Config", provider == "heygen", f"Current: {provider} (Expected: heygen)")
    
    api_key = os.getenv("HEYGEN_API_KEY")
    print_result("API Key Present", bool(api_key), "Key found in .env" if api_key else "Missing HEYGEN_API_KEY")

    # 2. Check Local Assets
    # Current file is in backend/verify_heygen_full.py
    # We want backend/static/DORA-14.jpg
    base_dir = os.path.dirname(__file__) # backend
    dora_path = os.path.join(base_dir, "static", "DORA-14.jpg") 
    
    # Also check avatars/DORA-14.jpg
    dora_path_2 = os.path.join(base_dir, "static", "avatars", "DORA-14.jpg")
    
    if os.path.exists(dora_path):
        print_result("Fallback Avatar", True, f"Path: {dora_path}")
    elif os.path.exists(dora_path_2):
        print_result("Fallback Avatar", True, f"Path: {dora_path_2}")
    else:
        print_result("Fallback Avatar", False, f"Not found at {dora_path} or {dora_path_2}")

    # 3. Check HeyGen API Connectivity
    try:
        print("\n⏳ Testing HeyGen API Connection (Listing Voices)...")
        # Set a shorter timeout for verification
        voices = heygen_service.list_voices()
        if "error" in voices:
             print_result("API Connection", False, f"Error: {voices['error']}")
        else:
             count = len(voices.get("data", {}).get("voices", []))
             print_result("API Connection", True, f"Success! Retrieved {count} voices.")
    except Exception as e:
        print_result("API Connection", False, f"Exception (Timeouts are common if HeyGen is overloaded): {e}")

    # 4. Verify Voice Logic
    print("\n🧠 Verifying Voice Selection Logic...")
    
    # Test Female
    target_f = heygen_service.NORWEGIAN_VOICE_IDS.get("female")
    # Simulate logic (we can't easily call generate without paying, but we can check the dict)
    print_result("Female Voice Map", target_f == "1d8e477dd21b40c1ab6726e50329a765", f"Female ID: {target_f}")
    
    # Test Male
    target_m = heygen_service.NORWEGIAN_VOICE_IDS.get("male")
    print_result("Male Voice Map", target_m == "4efd43386dc844c29d532cb5d5690f86", f"Male ID: {target_m}")
    
    print("\n--- VERIFICATION COMPLETE ---")

if __name__ == "__main__":
    verify_system()
