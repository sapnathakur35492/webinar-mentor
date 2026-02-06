import requests
import base64

def test_did():
    raw_creds = "amFuQGNoYW5nZTIwLm5v:qmW6r96kFlSSRYQBuws_R"
    creds_bytes = raw_creds.encode("utf-8")
    base64_creds = base64.b64encode(creds_bytes).decode("utf-8")
    auth_header = f"Basic {base64_creds}"
    
    url = "https://api.d-id.com/talks"
    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }
    
    payload = {
        "script": {
            "type": "text",
            "input": "<speak>Hello world</speak>",
            "provider": {
                "type": "microsoft",
                "voice_id": "en-US-JennyNeural"
            }
        },
        "source_url": "https://files.catbox.moe/68vt9u.jpg"
    }
    
    print("Testing D-ID API with simple speak tag...")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_did()
