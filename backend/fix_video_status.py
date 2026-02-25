"""Fix Webinar_Video Status from string to int 0."""
import asyncio, sys
sys.path.insert(0, ".")

async def fix():
    from motor.motor_asyncio import AsyncIOMotorClient
    from core.settings import settings
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    
    # Update all Webinar_Video records: string -> int 0
    result = await db["Webinar_Video"].update_many({}, {"$set": {"Status": 0}})
    print(f"Webinar_Video: Updated {result.modified_count} records to Status=0 (Pending)")
    
    # Verify
    cursor = db["Webinar_Video"].find({})
    records = await cursor.to_list(length=10)
    for r in records:
        print(f"  ID={r['_id']}, Status={r['Status']} (type={type(r['Status']).__name__}), TalkId={r.get('TalkId','?')}")
    
    client.close()

asyncio.run(fix())
