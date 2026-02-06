import requests
import json
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

BASE_URL = "http://localhost:8000/api/webinar"
ASSET_ID = "66f7f4d2f8319f6dafe2d34ded5243" # One from the verify_raw output (wait, need a valid one)

async def test_gen():
    # Let's get the first asset id
    resp = requests.get(f"{BASE_URL}/assets") # wait, need to find an asset
    # I'll just use the one I saw in raw output if I can get it precisely
    # ...
    pass

# I'll just run a manual curl-like request via requests
# Based on verify_media_persistence_raw.py output:
# I'll use 66f7f4d2f8319f6dafe2d34ded5243 if that was it

asset_id = "66f7f4d2f8319f6dafe2d34ded5243"

print(f"Testing image gen for asset {asset_id}...")
url = f"{BASE_URL}/images/generate"
payload = {
    "concept_id": asset_id,
    "media_type": "social_ad",
    "concept_text": "Webinar about scaling your coaching business using Norwegian AI"
}

try:
    resp = requests.post(url, json=payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
