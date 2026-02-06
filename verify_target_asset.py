import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv("backend/.env")

async def verify():
    client = AsyncIOMotorClient(os.getenv("DATABASE_URL"))
    db = client.get_default_database()
    collection = db["webinar_assets"]
    
    asset_id = "6968b6dafe2d34ded52439b7" # Use the exact string from your test
    print(f"Checking Asset ID: {asset_id}")
    
    # Try both as string and as ObjectId (Beanie documents usually use ObjectId)
    asset = await collection.find_one({"_id": ObjectId(asset_id)})
    if not asset:
        asset = await collection.find_one({"_id": asset_id})
    
    if asset:
        print("Asset found!")
        imgs = asset.get('promotional_images', [])
        print(f"Promotional Images: {len(imgs)}")
        for img in imgs:
            print(f"  - {img.get('media_type')}: {img.get('image_url')}")
    else:
        print("Asset NOT found in DB")

if __name__ == "__main__":
    asyncio.run(verify())
