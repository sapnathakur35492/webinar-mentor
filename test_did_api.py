import requests
import base64

def test_did(payload_type="ssml"):
    raw_creds = "amFuQGNoYW5nZTIwLm5v:qmW6r96kFlSSRYQBuws_R"
    creds_bytes = raw_creds.encode("utf-8")
    base64_creds = base64.b64encode(creds_bytes).decode("utf-8")
    auth_header = f"Basic {base64_creds}"
    
    url = "https://api.d-id.com/talks"
    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }
    
    if payload_type == "ssml":
        # Format for Microsoft SSML
        ssml_input = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><prosody rate='slow'>This is a slow voice test.</prosody></speak>"
        payload = {
            "script": {
                "type": "text",
                "input": ssml_input,
                "provider": {
                    "type": "microsoft",
                    "voice_id": "en-US-JennyNeural"
                }
            },
            "source_url": "https://files.catbox.moe/68vt9u.jpg"
        }
    else:
        payload = {
            "script": {
                "type": "text",
                "input": "This is a normal voice test.",
                "provider": {
                    "type": "microsoft",
                    "voice_id": "en-US-JennyNeural"
                }
            },
            "source_url": "https://files.catbox.moe/68vt9u.jpg"
        }
    
    print(f"Testing D-ID API with {payload_type}...")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_did("ssml")
    test_did("text")
