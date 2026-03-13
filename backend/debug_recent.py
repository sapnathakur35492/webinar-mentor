import asyncio
from database_mongo import init_db
from api.models import WebinarAsset, WebinarProcessingJob
import json

async def check_recent_assets():
    await init_db()
    assets = await WebinarAsset.find().sort("-created_at").limit(3).to_list()
    for i, asset in enumerate(assets):
        print(f"\n--- Asset {i} ({asset.id}) ---")
        print(f"Mentor ID: {asset.mentor_id}")
        content = asset.onboarding_doc_content or ""
        print(f"Content Length: {len(content)}")
        print(f"Content Preview: {content[:1000]}...")
        if asset.concepts_improved:
            print(f"Concepts Title: {[c.title for c in asset.concepts_improved]}")
        else:
            print("No concepts generated.")

    jobs = await WebinarProcessingJob.find().sort("-created_at").limit(5).to_list()
    for j in jobs:
        print(f"Job {j.id}: Status={j.status}, Progress={j.progress}, Msg={j.message}, Error={j.error}")

if __name__ == "__main__":
    asyncio.run(check_recent_assets())
