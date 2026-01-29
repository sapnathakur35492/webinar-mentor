"""
Test script for async PDF upload and MongoDB verification
"""
import requests
import time
import os

# Test configuration
API_BASE = "http://localhost:8000/api/webinar"
PDF_PATH = r"c:\Users\Santosh\Documents\Change0_webinar\Perfect_Webinar_Only_Intro.pdf"

def test_upload_and_poll():
    print("=" * 60)
    print("Testing Async PDF Upload Flow")
    print("=" * 60)
    
    # Step 1: Upload PDF
    print("\n[1] Uploading PDF...")
    
    with open(PDF_PATH, 'rb') as f:
        files = {'file': ('Perfect_Webinar_Only_Intro.pdf', f, 'application/pdf')}
        data = {
            'mentor_id': 'test_mentor_api_123',
            'onboarding_doc': 'Test onboarding document content for webinar AI generation. This is a comprehensive test.',
            'hook_analysis': 'Test hook analysis - analyzing engagement patterns and conversion strategies.'
        }
        
        response = requests.post(f"{API_BASE}/upload-context", files=files, data=data)
    
    print(f"Response Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    if result.get('status') != 'accepted':
        print("ERROR: Expected 'accepted' status!")
        return False
    
    job_id = result.get('job_id')
    print(f"\n✅ Job created: {job_id}")
    
    # Step 2: Poll for job status
    print("\n[2] Polling job status...")
    max_polls = 30  # 2.5 minutes max
    poll_count = 0
    
    while poll_count < max_polls:
        poll_count += 1
        time.sleep(5)
        
        status_response = requests.get(f"{API_BASE}/jobs/{job_id}/status")
        status = status_response.json()
        
        print(f"  Poll {poll_count}: status={status['status']}, progress={status['progress']}%, message={status['message'][:50]}...")
        
        if status['status'] == 'completed':
            print(f"\n✅ Job completed! Asset ID: {status.get('asset_id')}")
            return True
        
        if status['status'] == 'failed':
            print(f"\n❌ Job failed: {status.get('error')}")
            return False
    
    print("\n⚠️ Timeout - job still processing")
    return False

if __name__ == "__main__":
    test_upload_and_poll()
