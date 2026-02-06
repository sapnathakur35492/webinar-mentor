import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath("."))
from database_mongo import init_db
from api.models import WebinarAsset
from api.services.webinar_ai import webinar_ai_service

async def fix_grandma():
    await init_db()
    print("Connected to DB.")
    
    # Simple search: Get all recent assets
    assets = await WebinarAsset.find_all().to_list()
    print(f"Found {len(assets)} total assets.")
    
    count = 0
    for asset in assets:
        # Check concepts_improved for "grandma"
        found_grandma = False
        if asset.concepts_improved:
            for c in asset.concepts_improved:
                c_str = str(c).lower()
                if "grandma" in c_str or "automating business" in c_str.lower():
                    found_grandma = True
                    break
        
        # Check concepts_original too
        if not found_grandma and asset.concepts_original:
             for c in asset.concepts_original:
                c_str = str(c).lower()
                if "grandma" in c_str or "automating business" in c_str.lower():
                    found_grandma = True
                    break
        
        if found_grandma:
            print(f"Found GRANDMA in asset {asset.id}. Fixing...")
            # Overwrite with correct mocks
            mock_concepts = webinar_ai_service._get_mock_concepts()
            asset.concepts_original = mock_concepts
            asset.concepts_improved = mock_concepts
            asset.concepts_evaluated = "MOCK EVALUATION (Forced Fix)"
            await asset.save()
            print(f"Asset {asset.id} updated with {len(mock_concepts)} Norwegian Mock Concepts.")
            count += 1
            
    print(f"Fixed {count} assets.")

if __name__ == "__main__":
    asyncio.run(fix_grandma())
