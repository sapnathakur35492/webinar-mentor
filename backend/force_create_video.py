"""Force-create Webinar_Video collection explicitly and verify."""
import asyncio, sys
sys.path.insert(0, ".")

async def force_create():
    from motor.motor_asyncio import AsyncIOMotorClient
    from core.settings import settings
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    
    # List current collections
    collections = await db.list_collection_names()
    print("BEFORE - Collections containing 'Webinar':")
    for c in sorted(collections):
        if "ebinar" in c or "webinar" in c:
            print(f"  {c}")
    
    # Force create Webinar_Video collection explicitly
    if "Webinar_Video" not in collections:
        print("\nWebinar_Video NOT found! Creating explicitly...")
        await db.create_collection("Webinar_Video")
        print("Collection created!")
    else:
        print("\nWebinar_Video already exists in collection list")
    
    # Check document count
    wv_count = await db["Webinar_Video"].count_documents({})
    print(f"Webinar_Video document count: {wv_count}")
    
    if wv_count == 0:
        print("No documents found. Inserting seed record...")
        from datetime import datetime
        await db["Webinar_Video"].insert_one({
            "MentorId": "seed_mentor_001",
            "TalkId": "seed_talk_001",
            "Script": "Welcome to the Digital Mentor Blueprint webinar! Today I will share the exact framework...",
            "ScriptS3Url": "https://change20.s3.eu-north-1.amazonaws.com/onboarding-docs/video_script_seed_001.txt",
            "VideoS3Url": "",
            "VideoSourceUrl": "",
            "Status": "pending",
            "UploadedAt": datetime.utcnow()
        })
        print("Seed record inserted!")
        wv_count = await db["Webinar_Video"].count_documents({})
    
    # Also verify Webinar_Concept
    wc_count = await db["Webinar_Concept"].count_documents({})
    
    # Final verification
    collections = await db.list_collection_names()
    print("\nAFTER - All Webinar collections:")
    for c in sorted(collections):
        if "ebinar" in c or "webinar" in c:
            count = await db[c].count_documents({})
            print(f"  {c} -> {count} documents")
    
    print("\nDone! Refresh MongoDB Compass now.")
    client.close()

asyncio.run(force_create())
