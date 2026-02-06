import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from typing import Optional, List, Dict, Any
from pydantic import Field
from datetime import datetime

class Concept(Document): # Simplified for reading
    title: str
    big_idea: str

class WebinarAsset(Document):
    mentor_id: str
    onboarding_doc_content: Optional[str] = None
    concepts_original: List[Any] = []
    concepts_improved: List[Any] = []
    
    class Settings:
        name = "webinar_assets"

async def check_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.webinar_mentor, document_models=[WebinarAsset])
    
    assets = await WebinarAsset.find_all().sort("-updated_at").limit(1).to_list()
    if not assets:
        print("No assets found")
        return
        
    asset = assets[0]
    print(f"Asset ID: {asset.id}")
    print(f"Onboarding Doc Content (first 500 chars):\n{asset.onboarding_doc_content[:500] if asset.onboarding_doc_content else 'None'}")
    print("\nConcepts Original:")
    for c in asset.concepts_original:
        print(f"- {c.get('title') if isinstance(c, dict) else getattr(c, 'title', 'N/A')}")
    
    print("\nConcepts Improved:")
    for c in asset.concepts_improved:
        print(f"- {c.get('title') if isinstance(c, dict) else getattr(c, 'title', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(check_db())
