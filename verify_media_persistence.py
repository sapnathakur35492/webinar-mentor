import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from api.models import WebinarAsset
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def verify():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(os.getenv("DATABASE_URL"))
    await init_beanie(database=client.get_default_database(), document_models=[WebinarAsset])
    
    print("Fetching assets...")
    assets = await WebinarAsset.find_all().to_list()
    print(f"Found {len(assets)} assets.")
    
    for asset in assets:
        print(f"\nAsset ID: {asset.id}")
        print(f"Promotional Images: {len(asset.promotional_images) if asset.promotional_images else 0}")
        if asset.promotional_images:
            for img in asset.promotional_images:
                print(f"  - {img.get('media_type')}: {img.get('image_url')}")
        
        print(f"Video Status: {asset.video_status}")
        print(f"Video URL: {asset.video_url}")
        print(f"Video Talk ID: {asset.video_talk_id}")

if __name__ == "__main__":
    asyncio.run(verify())
