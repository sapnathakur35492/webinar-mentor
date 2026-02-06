import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv("backend/.env")

async def verify():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(os.getenv("DATABASE_URL"))
    db = client.get_default_database()
    collection = db["webinar_assets"]
    
    print("Fetching assets (raw)...")
    cursor = collection.find({})
    assets = await cursor.to_list(length=100)
    print(f"Found {len(assets)} assets.")
    
    for asset in assets:
        print(f"\nAsset ID: {asset.get('_id')}")
        imgs = asset.get('promotional_images', [])
        print(f"Promotional Images: {len(imgs)}")
        for img in imgs:
            print(f"  - {img.get('media_type')}: {img.get('image_url')}")
        
        print(f"Video Status: {asset.get('video_status')}")
        print(f"Video URL: {asset.get('video_url')}")
        print(f"Video Talk ID: {asset.get('video_talk_id')}")

if __name__ == "__main__":
    asyncio.run(verify())
