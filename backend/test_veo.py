import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found")
    exit(1)

model = "veo-3.1-generate-preview"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predictLongRunning"

headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": api_key,
}

# Test 1: Minimal Payload
payload1 = {
    "instances": [
        {
            "prompt": "Cyberpunk city with neon lights, cinematic 4k"
        }
    ],
    "parameters": {
        "aspectRatio": "16:9",
        "durationSeconds": "6" 
    }
}

# Test 2: Duration as number
payload2 = {
    "instances": [
        {
            "prompt": "Cyberpunk city with neon lights, cinematic 4k"
        }
    ],
    "parameters": {
        "aspectRatio": "16:9",
        "durationSeconds": 6
    }
}

# Test 3: No Parameters
payload3 = {
    "instances": [
        {
            "prompt": "Cyberpunk city with neon lights, cinematic 4k"
        }
    ]
}

# Test 4: Prompt in contents (doubtful for predict but possible)
payload4 = {
    "contents": [
        {"parts": [{"text": "Cyberpunk city with neon lights, cinematic 4k"}]}
    ],
    "generationConfig": {
         "aspectRatio": "16:9"
    }
}

import time

def run_test(name, payload):
    print(f"\n--- Running Test: {name} ---")
    time.sleep(10) # Avoid 429
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Error Response: {response.text}")
            with open("error.log", "w") as f:
                f.write(response.text)
        else:
            print("Success!")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Exception: {e}")

# run_test("Test 1 (String Duration)", payload1)
# run_test("Test 2 (Int Duration)", payload2)
run_test("Test 3 (No Params)", payload3)
# run_test("Test 4 (Contents)", payload4)
