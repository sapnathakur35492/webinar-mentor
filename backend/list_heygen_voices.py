import os
import sys
import requests
from dotenv import load_dotenv

# Ensure we have env vars
load_dotenv()

api_key = os.getenv("HEYGEN_API_KEY")
if not api_key:
    print("Error: HEYGEN_API_KEY not found in .env")
    sys.exit(1)

url = "https://api.heygen.com/v2/voices"
headers = {
    "x-api-key": api_key,
    "accept": "application/json"
}

try:
    print("Fetching voices...")
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    data = resp.json()
    
    voices = data.get("data", {}).get("voices", [])
    if not voices:
        print("No voices found or unexpected format.")
        print(data)
        sys.exit(0)
        
    print(f"Found {len(voices)} voices. Filtering for Norwegian (Norwegian)...")
    
    norwegian_voices = []
    for v in voices:
        # Check language parameters
        lang = str(v.get("language", "")).lower()
        locale = str(v.get("locale", "")).lower()
        
        if "norwegian" in lang or "nb-no" in locale:
            norwegian_voices.append(v)

    print(f"Found {len(norwegian_voices)} Norwegian voices:\n")
    for v in norwegian_voices:
        print(f"ID: {v.get('voice_id')}")
        print(f"Name: {v.get('name')}")
        print(f"Gender: {v.get('gender')}")
        print(f"Preview: {v.get('preview_audio')}")
        print("-" * 30)

except Exception as e:
    print(f"Error: {e}")
