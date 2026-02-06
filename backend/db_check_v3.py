import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from typing import Optional, List, Any
from dotenv import load_dotenv

# Load .env to get the real DATABASE_URL
load_dotenv(".env")
DATABASE_URL = os.getenv("DATABASE_URL")

class WebinarAsset(Document):
    mentor_id: str
    onboarding_doc_content: Optional[str] = None
    concepts_original: List[Any] = []
    concepts_improved: List[Any] = []
    
    class Settings:
        name = "webinar_assets"

async def check_db():
    try:
        if not DATABASE_URL:
            print("Error: DATABASE_URL not found in .env")
            return

        print(f"Connecting to MongoDB: {DATABASE_URL[:30]}...")
        sys.stdout.flush()
        client = AsyncIOMotorClient(DATABASE_URL, serverSelectionTimeoutMS=5000)
        
        # The db name is likely 'change20_db' based on the URI and database_mongo.py
        db_name = "change20_db"
        await init_beanie(database=client[db_name], document_models=[WebinarAsset])
        
        print("Fetching latest assets...")
        sys.stdout.flush()
        assets = await WebinarAsset.find_all().sort("-created_at").limit(3).to_list()
        
        if not assets:
            print("No assets found in 'webinar_assets' collection.")
            sys.stdout.flush()
            return
            
        for i, asset in enumerate(assets):
            print(f"\n--- Asset {i} (ID: {asset.id}) ---")
            print(f"Mentor ID: {asset.mentor_id}")
            print(f"Concepts Original Count: {len(asset.concepts_original)}")
            if asset.concepts_original:
                c = asset.concepts_original[0]
                # Handle both dict and object (though Beanie usually gives us the model or dict if not mapped fully)
                title = c.get('title') if isinstance(c, dict) else getattr(c, 'title', 'N/A')
                big_idea = c.get('big_idea') if isinstance(c, dict) else getattr(c, 'big_idea', 'N/A')
                print(f"First Concept Title: {title}")
                print(f"First Concept Big Idea (start): {str(big_idea)[:100]}...")
            
            print(f"Concepts Improved Count: {len(asset.concepts_improved)}")
            sys.stdout.flush()
            
    except Exception as e:
        print(f"Error: {e}")
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(check_db())
