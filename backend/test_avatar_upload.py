import requests
import os

def test_avatar_upload():
    url = "http://localhost:8000/api/webinar/video/upload-avatar"
    # Use an existing image or create a dummy one
    image_path = "test_avatar.jpg"
    if not os.path.exists(image_path):
        with open(image_path, "wb") as f:
            f.write(b"fake image data") # This might fail if it expects real image headers
    
    try:
        with open(image_path, "rb") as f:
            files = {"file": (image_path, f, "image/jpeg")}
            response = requests.post(url, files=files)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_avatar_upload()
