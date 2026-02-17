import os
import sys
import requests
import json
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

load_dotenv(override=True)

from api.services.heygen_service import heygen_service

def check_status(video_id):
    print(f"Checking status for Video ID: {video_id}")
    
    try:
        # We can use the service's internal method, or verify raw API response
        headers = heygen_service._headers()
        url = f"{heygen_service.api_base_v1}/video_status.get"
        
        print(f"Requesting {url}...")
        resp = requests.get(url, headers=headers, params={"video_id": video_id}, timeout=60)
        
        print(f"Status Code: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Error Response: {resp.text}")
            return

        data = resp.json()
        print("\n--- RAW RESPONSE ---")
        print(json.dumps(data, indent=2))
        print("--------------------\n")
        
        status = data.get("data", {}).get("status")
        error = data.get("data", {}).get("error")
        
        print(f"Parsed Status: {status}")
        if error:
            print(f"Parsed Error: {error}")

    except Exception as e:
        print(f"Exception checking status: {e}")

if __name__ == "__main__":
    # ID taken from user provided logs
    vid_id = "60b764f4109d49008223fc70ef8d38b2"
    check_status(vid_id)
