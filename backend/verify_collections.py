"""Quick check of both collections."""
import asyncio, sys
sys.path.insert(0, ".")

async def verify():
    from motor.motor_asyncio import AsyncIOMotorClient
    from core.settings import settings
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    
    collections = await db.list_collection_names()
    print("=== All Collections ===")
    for c in sorted(collections):
        print(f"  {c}")
    
    print()
    print("=== Webinar_Concept ===")
    wc_count = await db["Webinar_Concept"].count_documents({})
    print(f"  Document count: {wc_count}")
    cursor = db["Webinar_Concept"].find({})
    records = await cursor.to_list(length=10)
    for r in records:
        print(f"  ID: {r['_id']}")
        print(f"    MentorId: {r.get('MentorId', '?')}")
        print(f"    ConceptTitle: {r.get('ConceptTitle', '?')}")
        print(f"    Status: {r.get('Status', '?')}")
        s3 = r.get('S3Url', '')
        print(f"    S3Url: {s3}")
        data = r.get('ConceptData', {})
        print(f"    ConceptData keys: {list(data.keys()) if data else '(empty)'}")
    
    print()
    print("=== Webinar_Video ===")
    wv_count = await db["Webinar_Video"].count_documents({})
    print(f"  Document count: {wv_count}")
    cursor = db["Webinar_Video"].find({})
    records = await cursor.to_list(length=10)
    for r in records:
        print(f"  ID: {r['_id']}")
        print(f"    MentorId: {r.get('MentorId', '?')}")
        print(f"    TalkId: {r.get('TalkId', '?')}")
        print(f"    ScriptS3Url: {r.get('ScriptS3Url', '?')}")
        print(f"    VideoS3Url: {r.get('VideoS3Url', '?')}")
        print(f"    Status: {r.get('Status', '?')}")
    
    client.close()

asyncio.run(verify())
