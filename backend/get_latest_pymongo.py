import pymongo
import json
from core.settings import settings

def get_latest():
    uri = settings.DATABASE_URL
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client["Change20-Dev"]
    
    # Get last asset
    asset = db["WebinarAsset"].find_one(sort=[("created_at", pymongo.DESCENDING)])
    if asset:
        print(f"Asset ID: {asset.get('_id')}")
        print(f"Doc length: {len(asset.get('onboarding_doc_content', ''))}")
        concepts = asset.get("concepts_original", [])
        if concepts:
            print("--- ORIGINAL CONCEPTS ---")
            for c in concepts:
                print(f"Title: {c.get('title')}")
        else:
            print("No original concepts.")
            
        eval_text = asset.get("concepts_evaluated", "")
        if eval_text:
            print("\n--- EVALUATION ---")
            print(eval_text[:500])
    else:
        print("No assets found.")

if __name__ == "__main__":
    get_latest()
