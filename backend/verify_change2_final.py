import asyncio
import os
import sys
import json
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from dotenv import load_dotenv
# Load .env explicitly from backend folder BEFORE importing settings
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from api.models import WebinarAsset, Concept, WebinarProcessingJob
from api.services.webinar_ai import webinar_ai_service
from database_mongo import init_db
from core.settings import settings

async def verify_pipeline():
    print("--- Change 2.0 Final Pipeline Verification ---")
    
    # Init DB using project's existing logic
    await init_db()
    print("Connected to DB via init_db()")

    # 1. Create Mock Asset
    asset = WebinarAsset(
        mentor_id="test_mentor_change2",
        onboarding_doc_content="A professional course on high-ticket sales for mentors. Focus on authority and transformation.",
        hook_analysis_content="The market is tired of hype. They want professional, logic-based systems."
    )
    await asset.save()
    print(f"Created Test Asset: {asset.id}")

    # 2. Test Concepts Chain
    print("\n--- Phase 1: Concepts (Draft -> Eval -> Improve) ---")
    concepts_result = await webinar_ai_service.generate_concepts_chain(str(asset.id))
    
    # Reload asset
    asset = await WebinarAsset.get(asset.id)
    print(f"Generated {len(asset.concepts_improved)} improved concepts.")
    
    if asset.concepts_improved:
        c = asset.concepts_improved[0]
        print(f"Concept Title: {c.title}")
        print(f"Narrative Angle Present: {bool(c.narrative_angle)}")
        print(f"Offer Transition Logic Present: {bool(c.offer_transition_logic)}")
        
        # Verify long-form paragraphs (simple check)
        if len(c.big_idea) > 200:
            print("[OK] Big Idea is long-form (Change 2.0 requirement)")
        else:
            print("[WARN] Big Idea might be too short")
        
        # Select first concept
        asset.selected_concept = c
        await asset.save()
        print("Selected Concept #1")

    # 3. Test Structure
    print("\n--- Phase 2: Structure ---")
    concept_text = f"Big Idea: {asset.selected_concept.big_idea}\nHook: {asset.selected_concept.hook}"
    structure = await webinar_ai_service.generate_structure(str(asset.id), concept_text)
    print(f"Structure length: {len(structure)} chars")
    if "Part 1" in structure and "Slide" in structure:
        print("[OK] Structure seems to follow the outline format")

    # 4. Test Email Chain
    print("\n--- Phase 3: Emails (Strategy -> Draft -> Eval -> Improve) ---")
    # This might take a while
    strategy = await webinar_ai_service.generate_email_plan(
        str(asset.id), 
        structure, 
        "High-ticket mentor sales system"
    )
    
    # Reload asset to check email_plan
    asset = await WebinarAsset.get(asset.id)
    if asset.email_plan and asset.email_plan.emails:
        print(f"[OK] Generated {len(asset.email_plan.emails)} emails")
        first_email = asset.email_plan.emails[0]
        print(f"First Email Segment: {first_email.segment}")
        print(f"First Email Purpose: {first_email.purpose}")
        print(f"First Email Body Length: {len(first_email.body)} chars")
        
        if first_email.segment in ["pre_webinar", "post_webinar", "sales", "replay", "General"]:
             print("[OK] Email categorization metadata present")
    else:
        print("[FAIL] Email generation failed or no emails parsed")

    print("\n--- [DONE] Verification Complete ---")

if __name__ == "__main__":
    asyncio.run(verify_pipeline())
