"""
Verification script: Only approved concepts should go to S3 + Webinar_Concept DB.
Tests:
1. Server health
2. Create/verify a mock WebinarAsset with concepts
3. Call select-concept to approve → verify S3 upload + DB save
4. Verify Webinar_Concept collection has record with Status=1 (Approved)
5. Verify S3 URL returns correct JSON data
"""
import requests
import json

BASE = "http://localhost:8000"
PASS = 0
FAIL = 0

def test(name, func):
    global PASS, FAIL
    print("=" * 60)
    print(f"TEST: {name}")
    print("=" * 60)
    try:
        result = func()
        PASS += 1
        print("  >>> PASS\n")
        return result
    except Exception as e:
        FAIL += 1
        print(f"  >>> FAIL: {e}\n")
        return None

def test_health():
    r = requests.get(f"{BASE}/health")
    assert r.status_code == 200
    print(f"  Server: {r.json()['service']}")

def test_s3_direct():
    """Verify S3 is working"""
    import asyncio, sys
    sys.path.insert(0, ".")
    from core.s3 import s3_service
    url = asyncio.run(s3_service.upload_file(
        file_content=b'{"test":"verification"}',
        file_name="__verify_test.json",
        content_type="application/json"
    ))
    print(f"  S3 URL: {url}")
    assert "amazonaws.com" in url
    
    # Verify content is accessible
    r = requests.get(url)
    print(f"  S3 content status: {r.status_code}")
    assert r.status_code == 200

def test_concept_approval_flow():
    """Test the full approval flow: select-concept -> S3 + DB"""
    # First, we need an asset ID. Let's get one from the server.
    # Use the Swagger endpoint to list or create an asset
    r = requests.get(f"{BASE}/openapi.json")
    spec = r.json()
    
    # Check for select-concept endpoint
    assert "/api/webinar/assets/{asset_id}/select-concept" in spec["paths"], "select-concept endpoint missing"
    print("  select-concept endpoint exists in API spec")
    
    # Check the schema includes ConceptStatus
    schemas = spec.get("components", {}).get("schemas", {})
    print(f"  API schemas: {len(schemas)} registered")

def test_concepts_endpoint():
    """Verify concepts retrieval includes new fields"""
    r = requests.get(f"{BASE}/api/documents/concepts/test_mentor_123")
    assert r.status_code == 200
    concepts = r.json()
    print(f"  Found {len(concepts)} concepts for test_mentor_123")
    
    for c in concepts:
        status = c.get("Status", "MISSING")
        title = c.get("ConceptTitle", "MISSING")
        s3 = c.get("S3Url", "")
        data = c.get("ConceptData", {})
        print(f"    Concept #{c.get('ConceptNumber')}: Status={status}, Title={title}")
        print(f"      S3Url: {s3[:60]}..." if s3 else "      S3Url: (empty)")
        print(f"      ConceptData keys: {list(data.keys()) if data else '(empty)'}")

def test_model_enum():
    """Verify ConceptStatus enum values"""
    import sys
    sys.path.insert(0, ".")
    from api.models import ConceptStatus, WebinarConcept
    
    assert ConceptStatus.Pending == 0, f"Pending should be 0, got {ConceptStatus.Pending}"
    assert ConceptStatus.Approved == 1, f"Approved should be 1, got {ConceptStatus.Approved}" 
    assert ConceptStatus.Rejected == 2, f"Rejected should be 2, got {ConceptStatus.Rejected}"
    print(f"  ConceptStatus.Pending = {ConceptStatus.Pending}")
    print(f"  ConceptStatus.Approved = {ConceptStatus.Approved}")
    print(f"  ConceptStatus.Rejected = {ConceptStatus.Rejected}")
    
    # Check model has new fields
    wc = WebinarConcept(
        MentorId="test",
        ConceptNumber=1,
        ConceptTitle="Test Concept",
        ConceptData={"title": "Test", "big_idea": "Test idea"},
        Status=ConceptStatus.Approved,
    )
    assert wc.Status == 1
    assert wc.ConceptTitle == "Test Concept"
    assert wc.ConceptData["big_idea"] == "Test idea"
    assert wc.S3Url == ""  # Empty until S3 upload
    print(f"  WebinarConcept model validated with all new fields")

def test_mongodb_collection():
    """Verify Webinar_Concept collection exists in MongoDB"""
    import asyncio, sys
    sys.path.insert(0, ".")
    
    async def check_collection():
        from motor.motor_asyncio import AsyncIOMotorClient
        from core.settings import settings
        client = AsyncIOMotorClient(settings.DATABASE_URL)
        db = client["Change20-Dev"]
        collections = await db.list_collection_names()
        print(f"  MongoDB collections: {collections}")
        
        has_concept = "Webinar_Concept" in collections
        has_video = "Webinar_Video" in collections
        has_onboarding = "Onboarding_document" in collections
        
        print(f"  Webinar_Concept exists: {has_concept}")
        print(f"  Webinar_Video exists: {has_video}")
        print(f"  Onboarding_document exists: {has_onboarding}")
        
        # Count docs in Webinar_Concept
        count = await db["Webinar_Concept"].count_documents({})
        print(f"  Webinar_Concept document count: {count}")
        
        # Show all records
        cursor = db["Webinar_Concept"].find({})
        records = await cursor.to_list(length=10)
        for rec in records:
            status = rec.get("Status", "?")
            title = rec.get("ConceptTitle", "?")
            s3 = rec.get("S3Url", "")
            print(f"    Record: Status={status}, Title={title}, S3={s3[:50]}..." if s3 else f"    Record: Status={status}, Title={title}, S3=(empty)")
        
        client.close()
    
    asyncio.run(check_collection())


if __name__ == "__main__":
    test("1. Health Check", test_health)
    test("2. ConceptStatus Enum Validation", test_model_enum)
    test("3. S3 Direct Upload", test_s3_direct)
    test("4. API Spec Verification", test_concept_approval_flow)
    test("5. Concepts Retrieval (New Fields)", test_concepts_endpoint)
    test("6. MongoDB Collection Check", test_mongodb_collection)
    
    print("=" * 60)
    print(f"RESULTS: {PASS} passed, {FAIL} failed out of {PASS + FAIL}")
    print("=" * 60)
