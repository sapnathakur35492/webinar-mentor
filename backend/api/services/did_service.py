import requests
import time
import base64

class DIDService:
    def __init__(self):
        # User provided: amFuQGNoYW5nZTIwLm5v:qmW6r96kFlSSRYQBuws_R
        # This string IS the "API Key" from D-ID dashboard (User:Secret).
        # We must Base64 encode this entire string for the Basic Auth header.
        raw_creds = "amFuQGNoYW5nZTIwLm5v:qmW6r96kFlSSRYQBuws_R"
        
        creds_bytes = raw_creds.encode("utf-8")
        base64_creds = base64.b64encode(creds_bytes).decode("utf-8")
        self.auth_header = f"Basic {base64_creds}"
        self.base_url = "https://api.d-id.com"
        # Avatar URL pointing to our backend static folder
        from core.settings import settings
        self.default_avatar_url = f"{settings.BASE_URL}/static/avatars/DORA-14.jpg"

    def create_talk(self, text: str, source_url: str = None):
        if not source_url:
            source_url = self.default_avatar_url

        url = f"{self.base_url}/talks"
        
        payload = {
            "script": {
                "type": "text",
                "input": text[:500], # Limit length to 500 chars to prevent 504 Timeouts
                "provider": {
                    "type": "microsoft",
                    "voice_id": "en-US-GuyNeural" 
                }
            },
            "source_url": source_url
        }
        
        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 201:
                return response.json()
            elif response.status_code == 504:
                raise Exception("D-ID 504 Timeout: Text too long or service busy. Try a shorter script.")
            else:
                error_msg = f"D-ID API Error {response.status_code}: {response.text}"
                print(f"CRITICAL: {error_msg}")
                raise Exception(error_msg)
        except Exception as e:
            print(f"Connection Error: {e}")
            raise e

    def get_talk(self, talk_id: str):
        url = f"{self.base_url}/talks/{talk_id}"
        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            return None

did_service = DIDService()
    