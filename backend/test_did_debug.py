import requests
import base64
import time

# Credentials
raw_creds = "amFuQGNoYW5nZTIwLm5v:qmW6r96kFlSSRYQBuws_R"
creds_bytes = raw_creds.encode("utf-8")
base64_creds = base64.b64encode(creds_bytes).decode("utf-8")
auth_header = f"Basic {base64_creds}"

# URL
url = "https://api.d-id.com/talks"
source_url = "https://d.uguu.se/rHXPndnZ.jpg"  # The URL we generated

payload = {
    "script": {
        "type": "text",
        "input": "This is a test of the D-ID API system.",
        "provider": {
            "type": "microsoft",
            "voice_id": "en-US-GuyNeural" 
        }
    },
    "source_url": source_url
}

headers = {
    "Authorization": auth_header,
    "Content-Type": "application/json"
}

print(f"Testing D-ID API with Source: {source_url}")
print(f"Auth Header: {auth_header[:20]}...")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"EXCEPTION: {e}")
