import requests
import os
from PIL import Image
import io

file_path = r"c:\Users\Santosh\Documents\webinar-mentor\DORA-14.jpg"

if not os.path.exists(file_path):
    print("Error: File not found at", file_path)
    exit(1)

print(f"Processing {file_path}...")

# Resize
try:
    with Image.open(file_path) as img:
        # Convert to RGB if needed
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        print(f"Original Size: {img.size}", flush=True)
        
        # Resize if > 1200 width
        if img.width > 1200:
            print("Resizing...", flush=True)
            ratio = 1200 / img.width
            new_height = int(img.height * ratio)
            img = img.resize((1200, new_height)) # Default resampling
            print(f"Resized to: {img.size}", flush=True)
            
        # Save to buffer
        print("Saving to buffer...", flush=True)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        buffer.seek(0)
        
        print(f"Compressed Size: {len(buffer.getvalue())} bytes", flush=True)
        
        # Upload
        print("Uploading to catbox.moe...", flush=True)
        response = requests.post(
            "https://catbox.moe/user/api.php", 
            data={"reqtype": "fileupload"},
            files={"fileToUpload": ("dora_opt.jpg", buffer, "image/jpeg")}
        )

        print(f"Upload Status: {response.status_code}", flush=True)
        if response.status_code == 200:
            print("SUCCESS_URL_START", flush=True)
            print(response.text.strip(), flush=True)
            print("SUCCESS_URL_END", flush=True)
        else:
            print(f"Upload failed: {response.text}", flush=True)

except Exception as e:
    print(f"Error processing image: {e}", flush=True)
