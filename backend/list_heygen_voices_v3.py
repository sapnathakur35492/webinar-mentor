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
    
    with open("voices.txt", "w", encoding="utf-8") as f:
        for v in norwegian:
            f.write(f"{v.get('name')} ({v.get('gender')}): {v.get('voice_id')}\n")
    print("Done writing voices.txt")

except Exception as e:
    print(f"Error: {e}")
