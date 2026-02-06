import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from typing import Optional, List, Dict, Any
from pydantic import Field

class WebinarAsset(Document):
    mentor_id: str
    onboarding_doc_content: Optional[str] = None
    concepts_original: List[Any] = []
    
    class Settings:
        name = "webinar_assets"

async def check_db():
    try:
        print("Connecting to MongoDB...", file=sys.stdout)
        sys.stdout.flush()
        client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
        await init_beanie(database=client.webinar_mentor, document_models=[WebinarAsset])
        
        print("Fetching latest asset...", file=sys.stdout)
        sys.stdout.flush()
        assets = await WebinarAsset.find_all().sort("-created_at").limit(5).to_list()
        
        if not assets:
            print("No assets found", file=sys.stdout)
            sys.stdout.flush()
            return
            
        for i, asset in enumerate(assets):
            print(f"\n--- Asset {i} ({asset.id}) ---", file=sys.stdout)
            print(f"Onboarding Doc (first 200 chars): {asset.onboarding_doc_content[:200] if asset.onboarding_doc_content else 'EMPTY'}", file=sys.stdout)
            if asset.concepts_original:
                 print(f"First Concept Title: {asset.concepts_original[0].get('title') if isinstance(asset.concepts_original[0], dict) else 'N/A'}", file=sys.stdout)
            sys.stdout.flush()
    except Exception as e:
        print(f"Error: {e}", file=sys.stdout)
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(check_db())
