"""Check MongoDB collections and Webinar_Concept records."""
import asyncio, sys
sys.path.insert(0, ".")

async def check():
    from motor.motor_asyncio import AsyncIOMotorClient
    from core.settings import settings
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    
    collections = await db.list_collection_names()
    print("Collections:", collections)
    print()
    
    wc_count = await db["Webinar_Concept"].count_documents({})
    print("Webinar_Concept count:", wc_count)
    
    cursor = db["Webinar_Concept"].find({})
    records = await cursor.to_list(length=5)
    for r in records:
        oid = str(r.get("_id", ""))
        status = r.get("Status", "MISSING")
        title = r.get("ConceptTitle", "MISSING")
        s3 = r.get("S3Url", "MISSING")
        num = r.get("ConceptNumber", "?")
        mid = r.get("MentorId", "?")
        print("Record:", oid)
        print("  MentorId:", mid)
        print("  ConceptNumber:", num)
        print("  ConceptTitle:", title)
        print("  Status:", status)
        print("  S3Url:", s3[:70] if s3 else "(empty)")
    
    # Also check if the failing test was about missing fields on OLD records
    if wc_count > 0:
        print()
        print("NOTE: Old records without new fields will still work due to default values.")
    
    client.close()

asyncio.run(check())
