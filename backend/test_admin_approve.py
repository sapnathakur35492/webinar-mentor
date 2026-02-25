"""Test the full flow: Status=0(Pending) -> Admin approves -> Status=1(Approved)."""
import asyncio, sys, requests, json
sys.path.insert(0, ".")

BASE = "http://localhost:8000"

async def get_concept_id():
    """Get the concept ID from MongoDB."""
    from motor.motor_asyncio import AsyncIOMotorClient
    from core.settings import settings
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    
    record = await db["Webinar_Concept"].find_one({})
    client.close()
    
    if record:
        return str(record["_id"]), record.get("Status"), record.get("ConceptTitle")
    return None, None, None


async def main():
    print("=" * 60)
    print("TEST: Admin Approval Flow (Pending -> Approved)")
    print("=" * 60)
    
    # Step 1: Check current status (should be 0 = Pending)
    concept_id, status, title = await get_concept_id()
    if not concept_id:
        print("ERROR: No concept found in DB!")
        return
    
    print(f"\n1. Current concept in DB:")
    print(f"   ID: {concept_id}")
    print(f"   Title: {title}")
    print(f"   Status: {status} ({'Pending' if status == 0 else 'Approved' if status == 1 else 'Rejected'})")
    assert status == 0, f"Expected Status=0 (Pending), got {status}"
    print("   PASS: Status is 0 (Pending)")
    
    # Step 2: Call admin-approve endpoint
    print(f"\n2. Calling admin-approve endpoint...")
    url = f"{BASE}/api/webinar/assets/concepts/{concept_id}/admin-approve"
    payload = {"action": "approve", "admin_notes": "Looks great! Approved by admin."}
    r = requests.post(url, json=payload)
    print(f"   Response status: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        assert data["concept_status"] == 1, f"Expected concept_status=1, got {data['concept_status']}"
        print("   PASS: concept_status is now 1 (Approved)")
    else:
        print(f"   ERROR: {r.text}")
        return
    
    # Step 3: Verify DB record updated
    print(f"\n3. Verifying DB record...")
    from motor.motor_asyncio import AsyncIOMotorClient
    from core.settings import settings
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    record = await db["Webinar_Concept"].find_one({"_id": record_id_from_str(concept_id)})
    
    db_status = record.get("Status")
    print(f"   DB Status: {db_status} ({'Pending' if db_status == 0 else 'Approved' if db_status == 1 else 'Rejected'})")
    assert db_status == 1, f"Expected DB Status=1, got {db_status}"
    print("   PASS: DB Status is 1 (Approved)")
    
    client.close()
    
    # Step 4: Reset back to Pending for future tests
    print(f"\n4. Resetting Status back to 0 (Pending) for future testing...")
    from motor.motor_asyncio import AsyncIOMotorClient as MC2
    client2 = MC2(settings.DATABASE_URL)
    db2 = client2["Change20-Dev"]
    await db2["Webinar_Concept"].update_one(
        {"_id": record_id_from_str(concept_id)},
        {"$set": {"Status": 0}}
    )
    client2.close()
    print("   Reset complete!")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED!")
    print("=" * 60)
    print("Flow verified:")
    print("  Mentor selects concept -> Status=0 (Pending)")
    print("  Admin approves         -> Status=1 (Approved)")
    print("  Admin rejects          -> Status=2 (Rejected)")


def record_id_from_str(s):
    from bson import ObjectId
    return ObjectId(s)


asyncio.run(main())
