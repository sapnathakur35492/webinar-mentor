import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from api.models import WebinarAsset, WebinarProcessingJob, Mentor, Project, Stage, User, InputArtifact, ApprovalHistory, OnboardingDocument, WebinarConcept, WebinarVideo
from core.settings import settings

async def get_latest_results():
    uri = settings.DATABASE_URL
    client = AsyncIOMotorClient(uri)
    db_name = "Change20-Dev"
    
    await init_beanie(database=client[db_name], document_models=[
        WebinarAsset, User, Mentor, Project, Stage, InputArtifact, WebinarProcessingJob, ApprovalHistory, OnboardingDocument, WebinarConcept, WebinarVideo
    ])
    
    # Get last 1 asset
    asset = await WebinarAsset.find().sort("-created_at").first_or_none()
    if asset:
        print(f"Asset ID: {asset.id}")
        print(f"Doc length: {len(asset.onboarding_doc_content or '')}")
        if asset.concepts_original:
            print("--- ORIGINAL CONCEPTS ---")
            for c in asset.concepts_original:
                print(f"Title: {c.title}")
                print(f"Big Idea (start): {c.big_idea[:200]}...")
        else:
            print("No original concepts.")
        
        if asset.concepts_evaluated:
            print("\n--- EVALUATION ---")
            print(asset.concepts_evaluated[:500])
            
    else:
        print("No assets found.")

if __name__ == "__main__":
    asyncio.run(get_latest_results())
