"""
Full end-to-end API test for all S3 storage features.
Tests: Health, Document Upload, Document Retrieval, Concepts Retrieval, Videos Retrieval
"""
import requests
import json

BASE = "http://localhost:8000"
MENTOR_ID = "test_mentor_123"
PASS = 0
FAIL = 0

def test(name, func):
    global PASS, FAIL
    print("=" * 60)
    print(f"TEST: {name}")
    print("=" * 60)
    try:
        func()
        PASS += 1
        print("  ✓ PASS\n")
    except Exception as e:
        FAIL += 1
        print(f"  ✗ FAIL: {e}\n")

def test_health():
    r = requests.get(f"{BASE}/health")
    assert r.status_code == 200, f"Status {r.status_code}"
    data = r.json()
    print(f"  Status: {data['status']}, Service: {data['service']}")

def test_document_upload():
    with open("test_onboarding.pdf", "rb") as f:
        r = requests.post(
            f"{BASE}/api/documents/upload?mentor_id={MENTOR_ID}",
            files={"file": ("test_onboarding.pdf", f, "application/pdf")}
        )
    assert r.status_code == 200, f"Status {r.status_code}: {r.text[:100]}"
    doc = r.json()
    fn = doc.get("FileName", "")
    s3 = doc.get("S3Url", "")
    mid = doc.get("MentorId", "")
    print(f"  FileName: {fn}")
    print(f"  S3Url: {s3[:80]}...")
    print(f"  MentorId: {mid}")
    assert "s3" in s3.lower() or "amazonaws" in s3.lower(), "S3 URL missing"

def test_document_retrieval():
    r = requests.get(f"{BASE}/api/documents/mentor/{MENTOR_ID}")
    assert r.status_code == 200, f"Status {r.status_code}"
    docs = r.json()
    print(f"  Found {len(docs)} documents")
    for d in docs[:3]:
        fn = d.get("FileName", "?")
        s3 = d.get("S3Url", "")[:60]
        print(f"    - {fn} -> {s3}...")
    assert len(docs) >= 1, "No documents found"

def test_concepts_retrieval():
    r = requests.get(f"{BASE}/api/documents/concepts/{MENTOR_ID}")
    assert r.status_code == 200, f"Status {r.status_code}"
    concepts = r.json()
    print(f"  Found {len(concepts)} concepts")
    for c in concepts[:3]:
        num = c.get("ConceptNumber", "?")
        s3 = c.get("S3Url", "")[:60]
        print(f"    - Concept #{num} -> {s3}...")

def test_videos_retrieval():
    r = requests.get(f"{BASE}/api/documents/videos/{MENTOR_ID}")
    assert r.status_code == 200, f"Status {r.status_code}"
    videos = r.json()
    print(f"  Found {len(videos)} videos")
    for v in videos[:3]:
        tid = v.get("TalkId", "?")
        st = v.get("Status", "?")
        sc = v.get("Script", "")[:50]
        print(f"    - TalkId: {tid}, Status: {st}, Script: {sc}...")

def test_s3_direct_upload():
    """Test S3 upload works with a raw text file"""
    import asyncio
    import sys
    sys.path.insert(0, ".")
    from core.s3 import s3_service
    url = asyncio.run(s3_service.upload_file(
        file_content=b"E2E test content " + str(id(test_s3_direct_upload)).encode(),
        file_name="__e2e_test.txt",
        content_type="text/plain"
    ))
    print(f"  S3 URL: {url}")
    assert "amazonaws.com" in url, "S3 URL not valid"

def test_swagger_docs():
    r = requests.get(f"{BASE}/openapi.json")
    assert r.status_code == 200, f"Status {r.status_code}"
    spec = r.json()
    paths = list(spec.get("paths", {}).keys())
    print(f"  API has {len(paths)} endpoints")
    key_paths = ["/api/documents/upload", "/api/documents/concepts/{mentor_id}", "/api/documents/videos/{mentor_id}"]
    for kp in key_paths:
        found = kp in paths
        print(f"    {'✓' if found else '✗'} {kp}")
        assert found, f"Missing endpoint: {kp}"

if __name__ == "__main__":
    test("Health Check", test_health)
    test("S3 Direct Upload", test_s3_direct_upload)
    test("Document Upload to S3 + MongoDB", test_document_upload)
    test("Document Retrieval", test_document_retrieval)
    test("Concepts Retrieval", test_concepts_retrieval)
    test("Videos Retrieval", test_videos_retrieval)
    test("Swagger/OpenAPI Endpoints", test_swagger_docs)
    
    print("=" * 60)
    print(f"RESULTS: {PASS} passed, {FAIL} failed out of {PASS + FAIL}")
    print("=" * 60)
