import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("HEYGEN_API_KEY")
print(f"Testing HeyGen API Key: {api_key[:10]}...")

headers = {
    "X-Api-Key": api_key,
    "accept": "application/json"
}

# Test 1: List voices
print("\n--- Test 1: Listing Voices ---")
url_voices = "https://api.heygen.com/v2/voices"
try:
    resp = requests.get(url_voices, headers=headers, timeout=10)
    print(f"Status Code: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json().get("data", {})
        voices = data.get("voices", [])
        print(f"Found {len(voices)} voices.")
        # Check specific Norwegian voices
        nb_voices = [v for v in voices if "norwegian" in str(v.get("language", "")).lower()]
        print(f"Found {len(nb_voices)} Norwegian voices.")
        for v in nb_voices:
             print(f" - {v.get('name')} ({v.get('voice_id')})")
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Exception: {e}")

# Test 2: Check Quota
print("\n--- Test 2: Checking Quota ---")
url_remaining = "https://api.heygen.com/v1/remaining_credits"
try:
    # This endpoint might be different in V2, let's try V1 as fallback
    resp = requests.get(url_remaining, headers=headers, timeout=10)
    print(f"Status Code: {resp.status_code}")
    if resp.status_code == 200:
        print(f"Quota Info: {resp.json()}")
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Exception: {e}")
