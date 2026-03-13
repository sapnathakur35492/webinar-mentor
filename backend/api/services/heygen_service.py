import os
import mimetypes
import requests
from typing import Any, Dict, Optional
from core.settings import settings
import time
from dotenv import load_dotenv

class HeyGenService:
    """
    Minimal HeyGen client for:
    - Uploading/using a talking_photo_id (photo avatar)
    - Generating a video from text
    - Polling status to get the final video URL
    """

    def __init__(self) -> None:
        self.api_key = os.getenv("HEYGEN_API_KEY") or getattr(settings, "HEYGEN_API_KEY", "")
        self.api_base_v2 = "https://api.heygen.com/v2"
        self.api_base_v1 = "https://api.heygen.com/v1"
        self.upload_base_v1 = "https://upload.heygen.com/v1"

        # Defaults (can be overridden per-request)
        self.default_talking_photo_id = os.getenv("HEYGEN_TALKING_PHOTO_ID") or getattr(
            settings, "HEYGEN_TALKING_PHOTO_ID", ""
        )
        self.default_voice_id = os.getenv("HEYGEN_VOICE_ID") or getattr(settings, "HEYGEN_VOICE_ID", "")
        self.use_avatar_iv_model = (os.getenv("HEYGEN_USE_AVATAR_IV", "true").lower() == "true") or getattr(
            settings, "HEYGEN_USE_AVATAR_IV", True
        )
        self._cached_voice_id: Optional[str] = None
        
        # Hardcoded High-Quality Norwegian Voices
        self.NORWEGIAN_VOICE_IDS = {
            "female": "1d8e477dd21b40c1ab6726e50329a765", # Iselin - Natural
            "male": "4efd43386dc844c29d532cb5d5690f86"    # Finn - Natural
        }

    def _headers(self) -> Dict[str, str]:
        # Refresh key from env (so .env edits work without manual restarts)
        self.api_key = os.getenv("HEYGEN_API_KEY") or self.api_key
        if not self.api_key:
            raise ValueError("HEYGEN_API_KEY is not set")
        # Docs show both `X-Api-Key` and `x-api-key`; HeyGen accepts either.
        return {"X-Api-Key": self.api_key, "accept": "application/json"}

    def upload_talking_photo(self, image_path: str) -> Dict[str, Any]:
        """
        Upload a photo to get a talking_photo_id.
        Docs: POST https://upload.heygen.com/v1/talking_photo
        """
        # Refresh key from env just in case (force reload from disk)
        load_dotenv(override=True)
        self.api_key = os.getenv("HEYGEN_API_KEY") or self.api_key
        if not self.api_key:
            raise ValueError("HEYGEN_API_KEY is not set")

        content_type, _ = mimetypes.guess_type(image_path)
        if content_type not in ("image/jpeg", "image/png"):
            # Default to jpeg if unknown
            content_type = "image/jpeg"

        with open(image_path, "rb") as f:
            data = f.read()

        headers = {"x-api-key": self.api_key, "Content-Type": content_type, "accept": "application/json"}
        url = f"{self.upload_base_v1}/talking_photo"
        resp = requests.post(url, headers=headers, data=data, timeout=120)
        resp.raise_for_status()
        payload = resp.json()
        # HeyGen responses can be either {code:100,...} or {error:null,data:{...}}
        if payload.get("code") not in (None, 100) and payload.get("error") is not None:
            raise ValueError(f"HeyGen upload error: {payload}")
        if payload.get("error") not in (None, {}):
            raise ValueError(f"HeyGen upload error: {payload}")
        return payload

    def generate_video(
        self,
        script_text: str,
        image_path: Optional[str] = None,
        talking_photo_id: Optional[str] = None,
        avatar_id: Optional[str] = None,
        voice_id: Optional[str] = None,
        background_color: str = "#FAFAFA",
        use_avatar_iv_model: Optional[bool] = None,
        gender: Optional[str] = "female" # Default to female if not specified
    ) -> Dict[str, Any]:
        """
        Generate an avatar video.
        - If image_path is provided, uploads it as a talking photo first.
        - If talking_photo_id provided, uses that.
        - If avatar_id provided, uses that (avatar character).
        """
        if not script_text or not script_text.strip():
            raise ValueError("script_text is required")

        # Refresh defaults from env (supports hot-reload on Windows)
        self.default_talking_photo_id = os.getenv("HEYGEN_TALKING_PHOTO_ID") or self.default_talking_photo_id
        self.default_voice_id = os.getenv("HEYGEN_VOICE_ID") or self.default_voice_id
        
        # 1. Handle Dynamic Image Upload if provided
        if image_path and os.path.exists(image_path):
            try:
                print(f"[HeyGenService] Uploading dynamic avatar image: {image_path}")
                upload_resp = self.upload_talking_photo(image_path)
                dynamic_id = (upload_resp.get("data") or {}).get("talking_photo_id")
                if dynamic_id:
                    print(f"[HeyGenService] Dynamic upload successful. ID: {dynamic_id}")
                    talking_photo_id = dynamic_id
            except Exception as e:
                print(f"[HeyGenService] Failed to upload dynamic image: {e}")
                # Fallback to default if upload fails

        if avatar_id:
            character_payload = {
                "type": "avatar",
                "avatar_id": avatar_id,
                "avatar_style": "normal"
            }
        else:
            # If no talking_photo_id set, try uploading the local Dora photo once as fallback
            talking_photo_id = talking_photo_id or self.default_talking_photo_id
            if not talking_photo_id:
                # Try known local locations
                # Service is in backend/api/services/heygen_service.py
                # We need backend/static/avatars/DORA-14.jpg
                
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__))) # api, backend
                
                candidates = [
                    os.path.join(base_dir, "static", "avatars", "DORA-14.jpg"),
                    os.path.join(base_dir, "static", "DORA-14.jpg"),
                    os.path.join(base_dir, "static", "avatars", "avatar_ebab264b.jpg"), # Known existing file
                ]
                
                print(f"[HeyGenService] Attempting fallbacks. Candidates: {candidates}")
                
                for p in candidates:
                    p = os.path.abspath(p)
                    if os.path.exists(p):
                        print(f"[HeyGenService] Found fallback avatar: {p}")
                        try:
                            uploaded = self.upload_talking_photo(p)
                            talking_photo_id = (uploaded.get("data") or {}).get("talking_photo_id")
                            # cache for future calls in-process
                            if talking_photo_id:
                                print(f"[HeyGenService] Fallback upload success: {talking_photo_id}")
                                self.default_talking_photo_id = talking_photo_id
                                break
                        except Exception as e:
                            print(f"[HeyGenService] Fallback upload failed for {p}: {e}")
            
            if not talking_photo_id:
                # If still no ID, we can't generate
                raise ValueError(
                    "talking_photo_id is required (provide image_path, set HEYGEN_TALKING_PHOTO_ID, or upload a photo avatar in HeyGen)"
                )
            
            character_payload = {
                "type": "talking_photo",
                "talking_photo_id": talking_photo_id,
            }

        # VOICE SELECTION logic
        # 1. Use passed voice_id if any (override)
        # 2. Use gender-specific default if available
        # 3. Fallback to generic default
        
        target_voice_id = voice_id or self.default_voice_id
        if not target_voice_id and gender:
            target_voice_id = self.NORWEGIAN_VOICE_IDS.get(gender.lower())
            
        if not target_voice_id:
             target_voice_id = self._pick_default_norwegian_voice_id() # Last resort fallback
             
        if not target_voice_id:
            raise ValueError("voice_id is required (set HEYGEN_VOICE_ID or pass in request)")

        url = f"{self.api_base_v2}/video/generate"
        headers = {**self._headers(), "Content-Type": "application/json"}

        body: Dict[str, Any] = {
            "video_inputs": [
                {
                    "character": character_payload,
                    "voice": {"type": "text", "input_text": script_text, "voice_id": target_voice_id},
                    "background": {"type": "color", "value": background_color},
                    "dimension": {"width": 960, "height": 540},
                }
            ]
        }

        # SPEED & MOTION OPTIMIZATION:
        # 1. Force Avatar IV for better facial expression and head movement
        # 2. 540p resolution renders significantly faster than 720p or 1080p
        # UPDATE: User requested "Hand Movement" and quality. Re-enabling Avatar IV.
        body["use_avatar_iv_model"] = True

        resp = requests.post(url, headers=headers, json=body, timeout=180)
        resp.raise_for_status()
        payload = resp.json()
        # HeyGen responses can be either {code:100,...} or {error:null,data:{...}}
        if payload.get("code") not in (None, 100) and payload.get("error") is not None:
            raise ValueError(f"HeyGen generate error: {payload}")
        if payload.get("error") not in (None, {}):
            raise ValueError(f"HeyGen generate error: {payload}")

        video_id = (payload.get("data") or {}).get("video_id")
        if not video_id:
            raise ValueError(f"HeyGen generate response missing video_id: {payload}")

        # Return a compatible shape (frontend expects `id`)
        return {"id": video_id, "status": "processing", "provider": "heygen", "raw": payload}

    def get_video_status(self, video_id: str) -> Dict[str, Any]:
        """
        Poll status until completed.
        Docs: GET https://api.heygen.com/v1/video_status.get?video_id=...
        """
        if not video_id:
            raise ValueError("video_id is required")

        # MOCK HANDLING (so UI doesn't crash if HeyGen not configured)
        if "MOCK" in video_id:
            return {
                "id": video_id,
                # Do NOT return a random sample video (looks like an ad).
                "status": "error",
                "result_url": None,
                "items": [],
                "provider": "heygen-mock",
                "detail": "HeyGen not configured for real video output.",
            }

        url = f"{self.api_base_v1}/video_status.get"
        resp = requests.get(url, headers=self._headers(), params={"video_id": video_id}, timeout=60)
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("code") not in (None, 100) and payload.get("error") is not None:
            raise ValueError(f"HeyGen status error: {payload}")
        if payload.get("error") not in (None, {}):
            raise ValueError(f"HeyGen status error: {payload}")

        data = payload.get("data") or {}
        status = (data.get("status") or "").lower()

        # Common HeyGen statuses: processing / completed / failed
        if status in ("completed", "done", "success", "succeeded"):
            video_url = data.get("video_url") or data.get("url")
            return {
                "id": video_id,
                "status": "done",
                "result_url": video_url,
                "items": [{"video_url": video_url}] if video_url else [],
                "provider": "heygen",
                "raw": payload,
            }

        if status in ("failed", "error"):
            # Try to extract a useful error message from HeyGen's raw payload
            error_detail = "HeyGen reported a failure"
            if payload.get("data") and payload["data"].get("error"):
                error_detail = str(payload["data"]["error"])
            elif payload.get("error"):
                 error_detail = str(payload["error"])
                 
            return {
                "id": video_id, 
                "status": "error", 
                "provider": "heygen", 
                "detail": error_detail,
                "raw": payload
            }

        return {"id": video_id, "status": "processing", "provider": "heygen", "raw": payload}

    def _pick_default_norwegian_voice_id(self) -> Optional[str]:
        """
        Best-effort: pick a Norwegian voice if HEYGEN_VOICE_ID not configured.
        Uses /v2/voices and tries to find nb-NO / Norwegian.
        """
        if self._cached_voice_id:
            return self._cached_voice_id
        try:
            voices = self.list_voices()
            data = voices.get("data") or voices.get("voices") or []
            # HeyGen commonly returns { data: { voices: [...] } }
            if isinstance(data, dict) and "voices" in data and isinstance(data["voices"], list):
                data = data["voices"]
            # Heuristic: find anything Norwegian
            for v in data:
                hay = " ".join([str(v.get(k, "")) for k in ("name", "language", "locale", "accent")]).lower()
                if "norwegian" in hay or "nb-no" in hay or "bokmål" in hay or "bokmal" in hay:
                    vid = v.get("voice_id") or v.get("id")
                    if vid:
                        self._cached_voice_id = vid
                        return vid
            # fallback: first voice id
            if data:
                vid = (data[0].get("voice_id") or data[0].get("id")) if isinstance(data[0], dict) else None
                self._cached_voice_id = vid
                return vid
        except Exception:
            return None
        return None

    def safe_generate_video(self, *args, **kwargs) -> Dict[str, Any]:
        """
        Wrapper to avoid throwing 500s to UI when HeyGen isn't configured yet.
        """
        try:
            return self.generate_video(*args, **kwargs)
        except Exception as e:
            print(f"[HeyGenService] CRITICAL ERROR in safe_generate_video: {e}")
            import traceback
            traceback.print_exc()
            # Return mock-like response
            return {
                "id": f"vid_MOCK_{int(time.time())}",
                "status": "error", # Explicitly mark as error so UI shows red
                "provider": "heygen-mock",
                "error": str(e), # Pass full error to UI
                "detail": f"HeyGen Generation Error: {str(e)}" # Detail for frontend info
            }

    def list_voices(self) -> Dict[str, Any]:
        """GET https://api.heygen.com/v2/voices"""
        url = f"{self.api_base_v2}/voices"
        resp = requests.get(url, headers=self._headers(), timeout=60)
        resp.raise_for_status()
        return resp.json()

    def list_avatar_groups(self) -> Dict[str, Any]:
        """GET https://api.heygen.com/v2/avatar_group.list"""
        url = f"{self.api_base_v2}/avatar_group.list"
        resp = requests.get(url, headers=self._headers(), timeout=60)
        resp.raise_for_status()
        return resp.json()

    def list_avatars_in_group(self, group_id: str) -> Dict[str, Any]:
        """GET https://api.heygen.com/v2/avatar_group/{group_id}/avatars"""
        url = f"{self.api_base_v2}/avatar_group/{group_id}/avatars"
        resp = requests.get(url, headers=self._headers(), timeout=60)
        resp.raise_for_status()
        return resp.json()


heygen_service = HeyGenService()

