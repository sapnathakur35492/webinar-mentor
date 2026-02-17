"""
Google Gemini Veo 3.1 Video Generation Service
Replaces HeyGen for avatar video creation.
Uses the user-uploaded image as the first frame of the generated video.
"""
import os
import time
import base64
import uuid
import requests
from typing import Any, Dict, Optional
from fastapi import HTTPException
from core.settings import settings


class GeminiVideoService:
    """
    Gemini Veo 3.1 client for:
    - Generating video from text prompt
    - Generating video from image + text prompt (image-to-video)
    - Polling operation status
    - Saving uploaded avatar images
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not set. Video generation will fail.")
        # Use the stable public preview model
        # Use the preview model (free tier friendly but rate limited)
        self.model = "veo-3.1-generate-preview"

        # Directories for storing files
        self.static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
        self.avatars_dir = os.path.join(self.static_dir, "avatars")
        self.videos_dir = os.path.join(self.static_dir, "videos")
        os.makedirs(self.avatars_dir, exist_ok=True)
        os.makedirs(self.videos_dir, exist_ok=True)

    def _headers(self):
        return {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

    def save_avatar_image(self, file_bytes: bytes, filename: str) -> Dict[str, str]:
        """
        Save an uploaded avatar image to static/avatars/.
        Returns dict with file_path and url.
        """
        ext = os.path.splitext(filename)[1] or ".jpg"
        unique_name = f"avatar_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(self.avatars_dir, unique_name)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        print(f"[Gemini] Avatar image saved: {file_path}")
        return {
            "file_path": file_path,
            "filename": unique_name,
            "url": f"/static/avatars/{unique_name}",
        }

    def generate_video(
        self,
        script_text: str,
        image_path: Optional[str] = None,
        aspect_ratio: str = "16:9",
        duration_seconds: int = 8,
        language_tone: str = "Norwegian",
    ) -> Dict[str, Any]:
        """
        Start video generation with Gemini Veo.
        
        Args:
            script_text: The prompt/script for the video
            image_path: Optional path to avatar image (used as first frame)
            aspect_ratio: "16:9" or "9:16"
            duration_seconds: 4, 6, or 8
            language_tone: "Norwegian" or "English"
            
        Returns:
            Dict with operation_name for polling
        """
        if not self.api_key:
            return {"error": "GEMINI_API_KEY not configured", "status": "error"}

        url = f"{self.BASE_URL}/models/{self.model}:predictLongRunning"

        # Construct Prompt with Language instruction
        if language_tone.lower() == "norwegian":
            final_prompt = f"Create a professional video. The characters should speak in Norwegian. Script/Action: {script_text}"
        else:
            final_prompt = f"Create a professional video. Language: English. Script/Action: {script_text}"

        # Build the instance
        instance: Dict[str, Any] = {
            "prompt": final_prompt,
        }

        # If image provided, encode it as base64 for image-to-video
        if image_path and os.path.exists(image_path):
            try:
                with open(image_path, "rb") as img_file:
                    image_bytes = img_file.read()
                
                # Detect mime type
                ext = os.path.splitext(image_path)[1].lower()
                mime_map = {
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".png": "image/png",
                    ".webp": "image/webp",
                }
                mime_type = mime_map.get(ext, "image/jpeg")
                
                image_b64 = base64.b64encode(image_bytes).decode("utf-8")
                instance["image"] = {
                    "bytesBase64Encoded": image_b64,
                    "mimeType": mime_type,
                }
                print(f"[Gemini] Using image as first frame: {image_path}")
            except Exception as e:
                print(f"[Gemini] Warning: Could not read image {image_path}: {e}")

        payload = {
            "instances": [instance],
            "parameters": {
                # "aspectRatio": aspect_ratio,
                # "durationSeconds": str(duration_seconds),
                # "personGeneration": "allow_all", 
            },
        }

        try:
            print(f"[Gemini] Starting video generation (Model: {self.model}): prompt='{final_prompt[:80]}...'")
            response = requests.post(url, headers=self._headers(), json=payload, timeout=60)
            
            if response.status_code == 429:
                print("Gemini API Rate Limit Hit (429)")
                raise HTTPException(
                    status_code=429, 
                    detail="Google Gemini API Rate Limit Exceeded. Please wait 1-2 minutes and try again. (Free tier limits)"
                )
            
            if response.status_code == 400:
                print(f"[Gemini] 400 Error Response: {response.text}")
            
            response.raise_for_status()
            data = response.json()

            operation_name = data.get("name", "")
            if not operation_name:
                print(f"[Gemini] Unexpected response: {data}")
                return {"error": "No operation name returned", "status": "error"}

            print(f"[Gemini] Video generation started: {operation_name}")
            return {
                "id": operation_name,
                "operation_name": operation_name,
                "status": "processing",
                "provider": "gemini",
            }
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            try:
                error_msg = e.response.text[:500] if e.response else str(e)
            except:
                pass
            print(f"[Gemini] Error starting video generation: {error_msg}")
            return {"error": error_msg, "status": "error"}

    def get_video_status(self, operation_name: str) -> Dict[str, Any]:
        """
        Poll the status of a video generation operation.
        
        Returns:
            Dict with status, result_url when done
        """
        if not self.api_key:
            return {"id": operation_name, "status": "error", "result_url": None, "detail": "GEMINI_API_KEY not set"}

        url = f"{self.BASE_URL}/{operation_name}"

        try:
            response = requests.get(url, headers=self._headers(), timeout=30)
            response.raise_for_status()
            data = response.json()

            is_done = data.get("done", False)

            if is_done:
                # Extract video URI from the response
                try:
                    video_uri = (
                        data.get("response", {})
                        .get("generateVideoResponse", {})
                        .get("generatedSamples", [{}])[0]
                        .get("video", {})
                        .get("uri", "")
                    )
                except (IndexError, KeyError):
                    video_uri = ""

                if video_uri:
                    # Download the video to local static directory
                    local_url = self._download_video(video_uri, operation_name)
                    print(f"[Gemini] Video ready: {local_url}")
                    return {
                        "id": operation_name,
                        "status": "done",
                        "result_url": local_url,
                        "provider": "gemini",
                    }
                else:
                    # Check for errors
                    error = data.get("error", {})
                    if error:
                        return {
                            "id": operation_name,
                            "status": "error",
                            "result_url": None,
                            "detail": error.get("message", "Unknown error"),
                        }
                    return {
                        "id": operation_name,
                        "status": "error",
                        "result_url": None,
                        "detail": "Video completed but no URI found",
                    }
            else:
                # Still processing
                metadata = data.get("metadata", {})
                return {
                    "id": operation_name,
                    "status": "processing",
                    "result_url": None,
                    "provider": "gemini",
                }

        except requests.exceptions.RequestException as e:
            error_msg = str(e)[:200]
            print(f"[Gemini] Error polling status: {error_msg}")
            return {
                "id": operation_name,
                "status": "error",
                "result_url": None,
                "detail": error_msg,
            }

    def _download_video(self, video_uri: str, operation_name: str) -> str:
        """
        Download a generated video from Gemini's URI to local static directory.
        Returns the local URL path for serving.
        """
        try:
            # Add API key to download URL
            download_url = video_uri
            if "?" in download_url:
                download_url += f"&key={self.api_key}"
            else:
                download_url += f"?key={self.api_key}"

            response = requests.get(
                download_url, 
                headers={"x-goog-api-key": self.api_key},
                stream=True, 
                timeout=120,
                allow_redirects=True,
            )
            response.raise_for_status()

            # Save with a unique name
            video_id = operation_name.split("/")[-1] if "/" in operation_name else operation_name[:16]
            video_filename = f"gemini_{video_id}.mp4"
            video_path = os.path.join(self.videos_dir, video_filename)

            with open(video_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"[Gemini] Video downloaded to: {video_path}")
            return f"/static/videos/{video_filename}"

        except Exception as e:
            print(f"[Gemini] Error downloading video: {e}")
            # Fall back to returning the Gemini URI directly
            return video_uri

    def safe_generate_video(self, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Wrapper to avoid throwing 500s to UI when Gemini isn't configured.
        """
        from fastapi import HTTPException
        if not self.api_key:
            print("[Gemini] API key not set - returning None")
            return None
        try:
            return self.generate_video(**kwargs)
        except HTTPException:
            # Re-raise FastAPIs HTTPException to let it hit the router
            raise
        except Exception as e:
            print(f"[Gemini] safe_generate_video unexpected error: {e}")
            import traceback
            traceback.print_exc()
            return None


# Singleton instance
gemini_video_service = GeminiVideoService()
