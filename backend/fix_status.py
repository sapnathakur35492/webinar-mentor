"""Update existing Webinar_Concept records to Status=0 (Pending)."""
import asyncio, sys
sys.path.insert(0, ".")

async def fix():
    from motor.motor_asyncio import AsyncIOMotorClient
    from core.settings import settings
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    
    # Update all existing records to Status=0 (Pending)
    result = await db["Webinar_Concept"].update_many({}, {"$set": {"Status": 0}})
    print(f"Updated {result.modified_count} records to Status=0 (Pending)")
    
    # Show all records
    cursor = db["Webinar_Concept"].find({})
    records = await cursor.to_list(length=10)
    for r in records:
        print(f"  ID={r['_id']}, Status={r['Status']}, Title={r.get('ConceptTitle','?')}")
    
    client.close()

asyncio.run(fix())
