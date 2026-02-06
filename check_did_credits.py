import requests
import base64

def check_credits():
    raw_creds = "amFuQGNoYW5nZTIwLm5v:qmW6r96kFlSSRYQBuws_R"
    creds_bytes = raw_creds.encode("utf-8")
    base64_creds = base64.b64encode(creds_bytes).decode("utf-8")
    auth_header = f"Basic {base64_creds}"
    
    url = "https://api.d-id.com/credits"
    headers = {
        "Authorization": auth_header
    }
    
    print("Checking D-ID Credits...")
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_credits()
