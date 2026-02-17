import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("HEYGEN_API_KEY")

url = "https://api.heygen.com/v2/voices"
headers = {"x-api-key": api_key}

try:
    resp = requests.get(url, headers=headers)
    data = resp.json()
    voices = data.get("data", {}).get("voices", [])
    
    norwegian = [v for v in voices if "norwegian" in str(v.get("language", "")).lower()]
    
    print(f"Found {len(norwegian)} Norwegian voices:")
    for v in norwegian:
        print(f"{v.get('name')} ({v.get('gender')}): {v.get('voice_id')}")

except Exception as e:
    print(e)
