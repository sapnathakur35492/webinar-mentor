import requests
import os

file_path = r"c:\Users\Santosh\Documents\webinar-mentor\DORA-14.jpg"

if not os.path.exists(file_path):
    print("Error: File not found at", file_path)
    exit(1)

print(f"Uploading {file_path} to transfer.sh...")

print(f"Uploading {file_path} to catbox.moe...")

try:
    with open(file_path, 'rb') as f:
        response = requests.post(
            "https://catbox.moe/user/api.php", 
            data={"reqtype": "fileupload"},
            files={"fileToUpload": f}
        )

    if response.status_code == 200:
        print("SUCCESS! Public URL:")
        print(response.text.strip())
    else:
        print(f"Upload failed: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
