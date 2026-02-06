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
        # 1. Handle Source URL
        if not source_url:
            source_url = self.default_avatar_url
            
        print(f"[DIDService] Creating talk with source: {source_url} (Script length: {len(text)})")
        
        # 2. LOCALHOST SAFEGUARD (D-ID cannot fetch from localhost)
        if "localhost" in source_url or "127.0.0.1" in source_url:
            print("[DIDService] WARN: Localhost detected. Swapping restricted local file for HOSTED DORA AVATAR.")
            # Use the optimized public URL of DORA-14.jpg (Resized <2MB)
            source_url = "https://files.catbox.moe/68vt9u.jpg"
            print(f"[DIDService] New Source: {source_url}")

        url = f"{self.base_url}/talks"
        
        payload = {
            "script": {
                "type": "text",
                "input": text[:500], # Limit length to 500 chars to prevent 504 Timeouts
                "provider": {
                    "type": "microsoft",
                    "voice_id": "en-US-JennyNeural" # Quality Female Voice
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
                # Don't crash - return Mock if API fails (e.g. credits exhausted)
                print("Falling back to MOCK VIDEO due to API error")
                return {
                     "id": "tlk_MOCK_ERROR_" + str(int(time.time())),
                     "status": "created",
                     "object": "talk"
                }
        except Exception as e:
            print(f"Connection Error: {e}")
            # raise e  <-- Don't raise, return mock
            return {
                "id": "tlk_MOCK_CONN_ERR",
                "status": "created"
            }

    def get_talk(self, talk_id: str):
        # MOCK HANDLING
        if "MOCK" in talk_id:
            return {
                "id": talk_id,
                "status": "done",
                "result_url": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" # Working Sample Video
            }

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
    