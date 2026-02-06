import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    print("\n[1] Testing Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_upload_context():
    print("\n[2] Testing Upload Context...")
    url = f"{BASE_URL}/api/webinar/upload-context"
    
    # Mentor ID from database (placeholder or real one if known)
    # Using a random ID for testing
    payload = {
        "mentor_id": "64b7f8e8c9e8e8e8e8e8e8e8",
        "onboarding_doc": "Sample onboarding content for testing.",
        "hook_analysis": "Sample hook analysis content for testing."
    }
    
    try:
        # Test without file first
        response = requests.post(url, data=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        if response.status_code == 200 and data.get("job_id"):
            return data["job_id"]
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_job_status(job_id):
    print(f"\n[3] Testing Job Status Polling for {job_id}...")
    url = f"{BASE_URL}/api/webinar/jobs/{job_id}/status"
    
    for i in range(10):  # Poll 10 times
        try:
            response = requests.get(url)
            data = response.json()
            print(f"Poll {i+1} - Status: {data.get('status')}, Progress: {data.get('progress')}%")
            
            if data.get("status") == "completed":
                print("Job completed successfully!")
                return data.get("asset_id")
            elif data.get("status") == "failed":
                print(f"Job failed: {data.get('error')}")
                return None
                
            time.sleep(5)
        except Exception as e:
            print(f"Error: {e}")
            break
    return None

if __name__ == "__main__":
    if test_health():
        job_id = test_upload_context()
        if job_id:
            asset_id = test_job_status(job_id)
            if asset_id:
                print(f"\nTest Successful! Asset ID created: {asset_id}")
            else:
                print("\nTest failed or timed out during job processing.")
        else:
            print("\nUpload Context failed.")
    else:
        print("\nBackend health check failed. Ensure server is running on localhost:8000")
