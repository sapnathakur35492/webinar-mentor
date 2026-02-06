import requests
import json
import difflib

BASE_URL = "http://localhost:8000/api/webinar"

# Use the test asset ID if known, or create a mock obj
ASSET_ID = "6985948fe2994505bdf06caf" # From previous verify output

def test_api():
    print(f"Testing API at {BASE_URL}")
    
    # 1. Trigger Generation
    url = f"{BASE_URL}/concepts/generate"
    payload = {"asset_id": ASSET_ID}
    
    try:
        print(f"POST {url} with {payload}")
        resp = requests.post(url, json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        
        data = resp.json()
        
        if resp.status_code == 200:
            concepts = data.get("data", {}).get("original", []) # or improved
            # If verify_change2_final logic is used, it returns dict with 'original', 'improved'
            # Let's inspect the actual structure
            
            # Check for legacy string
            resp_text = json.dumps(data)
            if "Automating business transformation" in resp_text:
                print("!! [FAIL] FOUND LEGACY STRING 'Automating business transformation'")
            elif "Perfect webinars without the stress" in resp_text:
                print("!! [FAIL] FOUND LEGACY STRING 'Perfect webinars without the stress'")
            else:
                print("[OK] Legacy strings NOT found in API response")
                
                print("[OK] Legacy strings NOT found in API response")
            
            # 2. Fetch Asset to see what was SAVED
            print(f"GET {BASE_URL}/assets/{ASSET_ID}")
            resp_asset = requests.get(f"{BASE_URL}/assets/{ASSET_ID}")
            if resp_asset.status_code == 200:
                asset_data = resp_asset.json()
                concepts_saved = asset_data.get("concepts_improved", [])
                if not concepts_saved:
                    concepts_saved = asset_data.get("concepts_original", [])
                
                print(f"Asset has {len(concepts_saved)} saved concepts")
                for i, c in enumerate(concepts_saved):
                    # Check for dict or object
                    title = c.get('title') if isinstance(c, dict) else getattr(c, 'title', 'No Title')
                    idea = c.get('big_idea', '') if isinstance(c, dict) else getattr(c, 'big_idea', '')
                    print(f"Saved Concept {i+1}: {title} - {idea[:50]}...")
                    
                    if "Automating business transformation" in idea:
                        print("!! [FAIL] DB HAS LEGACY DATA 'Automating business transformation'")
                    if "Perfect webinars" in idea:
                         print("!! [FAIL] DB HAS LEGACY DATA 'Perfect webinars'")
            else:
                print(f"Failed to fetch asset: {resp_asset.status_code}")
        else:
            print(f"Error: {resp.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_api()
