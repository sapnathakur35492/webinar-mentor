"""
Seed script: Creates Webinar_Concept and Webinar_Video collections in MongoDB
with sample records including S3 links.
"""
import asyncio
import sys
import json

sys.path.insert(0, ".")


async def seed_collections():
    from motor.motor_asyncio import AsyncIOMotorClient
    from beanie import init_beanie
    from core.settings import settings
    from core.s3 import s3_service
    from api.models import (
        WebinarAsset, WebinarConcept, ConceptStatus, WebinarVideo,
        User, Mentor, Project, Stage, InputArtifact,
        WebinarProcessingJob, ApprovalHistory, OnboardingDocument
    )

    # 1. Connect to MongoDB
    print("=" * 60)
    print("SEEDING: Webinar_Concept & Webinar_Video collections")
    print("=" * 60)
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    await init_beanie(database=db, document_models=[
        WebinarAsset, User, Mentor, Project, Stage, InputArtifact,
        WebinarProcessingJob, ApprovalHistory, OnboardingDocument,
        WebinarConcept, WebinarVideo
    ])
    print("Connected to MongoDB!")

    # ----------------------------------------------------------------
    # 2. Seed Webinar_Concept with approved concept data + S3 link
    # ----------------------------------------------------------------
    print("\n--- Seeding Webinar_Concept ---")
    
    # Sample approved concept data
    concept_data = {
        "title": "The Digital Mentor Blueprint",
        "big_idea": "Transform Your Expertise Into a Scalable Online Mentoring Business",
        "hook": "What if you could mentor 1000 people at once without losing the personal touch?",
        "structure_points": [
            "The Mentoring Gap: Why 90% of experts fail to scale",
            "The Blueprint Framework: 3 pillars of digital mentoring",
            "Secret 1: The Personalization Engine",
            "Secret 2: The Community Flywheel",
            "Secret 3: The Automation Stack",
            "Implementation roadmap: From 1-on-1 to 1-to-many"
        ],
        "secrets": [
            {
                "assumption": "Personal mentoring can't be scaled",
                "story": "How I went from 5 clients to 500 without hiring anyone",
                "belief": "Technology enables deeper, not shallower, connections",
                "transformation": "From trading time for money to creating impact at scale"
            },
            {
                "assumption": "Online courses are the only way to scale",
                "story": "The course that nobody completed vs the community that changed lives",
                "belief": "Engagement beats content volume every time",
                "transformation": "From course creator to community architect"
            },
            {
                "assumption": "You need a huge team to run a mentoring business",
                "story": "Building a 7-figure mentoring business with just 2 team members",
                "belief": "Smart automation lets you focus on what matters",
                "transformation": "From overwhelmed solopreneur to strategic leader"
            }
        ],
        "mechanism": "The Digital Mentor Blueprint Framework",
        "narrative_angle": "From burned-out 1-on-1 mentor to scalable impact creator",
        "offer_transition_logic": "Now that you've seen the framework works, let me show you how to implement it in your business in the next 90 days",
        "value_anchor": {
            "after_this": [
                "Build a scalable mentoring program",
                "Automate 80% of your admin work",
                "Create a self-sustaining community",
                "Generate recurring revenue while sleeping"
            ]
        },
        "bonus_ideas": [
            "Free Community Setup Checklist",
            "Automation Tool Comparison Guide",
            "90-Day Launch Calendar Template"
        ],
        "cta_sentence": "Join the Digital Mentor Blueprint program and transform your expertise into a scalable business!",
        "promises": [
            "Scale from 5 to 500+ clients in 90 days",
            "Reduce admin time by 80%",
            "Build a community that grows itself",
            "Create multiple revenue streams from your expertise"
        ]
    }

    # Upload concept data to S3
    concept_json = json.dumps(concept_data, indent=2, ensure_ascii=False)
    file_name = "approved_concept_seed_1.json"
    
    s3_url = await s3_service.upload_file(
        file_content=concept_json.encode("utf-8"),
        file_name=file_name,
        content_type="application/json"
    )
    print(f"  Uploaded concept to S3: {s3_url}")

    # Create Webinar_Concept record
    wc = WebinarConcept(
        MentorId="seed_mentor_001",
        ConceptNumber=1,
        ConceptTitle=concept_data["title"],
        ConceptData=concept_data,
        Status=ConceptStatus.Approved,  # Status = 1 (Approved)
        FileName=file_name,
        FileType="application/json",
        S3Url=s3_url,
    )
    await wc.insert()
    print(f"  Created Webinar_Concept record: {wc.id}")
    print(f"    MentorId: {wc.MentorId}")
    print(f"    ConceptTitle: {wc.ConceptTitle}")
    print(f"    Status: {wc.Status} (Approved)")
    print(f"    S3Url: {wc.S3Url}")
    print(f"    ConceptData keys: {list(wc.ConceptData.keys())}")

    # ----------------------------------------------------------------
    # 3. Seed Webinar_Video
    # ----------------------------------------------------------------
    print("\n--- Seeding Webinar_Video ---")
    
    # Upload sample script to S3
    sample_script = """Welcome to the Digital Mentor Blueprint webinar!
    
Today, I'm going to share with you the exact framework I used to go from 
mentoring 5 clients one-on-one to helping over 500 people simultaneously, 
without losing the personal touch that makes mentoring so powerful.

By the end of this webinar, you'll understand the 3 pillars of digital 
mentoring and have a clear roadmap to scale your expertise into a 
thriving online mentoring business.

Let's dive in..."""

    script_file_name = "video_script_seed_001.txt"
    script_s3_url = await s3_service.upload_file(
        file_content=sample_script.encode("utf-8"),
        file_name=script_file_name,
        content_type="text/plain"
    )
    print(f"  Uploaded script to S3: {script_s3_url}")

    # Create Webinar_Video record
    wv = WebinarVideo(
        MentorId="seed_mentor_001",
        TalkId="seed_talk_001",
        Script=sample_script,
        ScriptS3Url=script_s3_url,
        VideoS3Url="",
        VideoSourceUrl="",
        Status="pending",
    )
    await wv.insert()
    print(f"  Created Webinar_Video record: {wv.id}")
    print(f"    MentorId: {wv.MentorId}")
    print(f"    TalkId: {wv.TalkId}")
    print(f"    Script: {wv.Script[:80]}...")
    print(f"    ScriptS3Url: {wv.ScriptS3Url}")
    print(f"    Status: {wv.Status}")

    # ----------------------------------------------------------------
    # 4. Verify both collections
    # ----------------------------------------------------------------
    print("\n--- Verification ---")
    
    collections = await db.list_collection_names()
    
    wc_exists = "Webinar_Concept" in collections
    wv_exists = "Webinar_Video" in collections
    
    wc_count = await db["Webinar_Concept"].count_documents({})
    wv_count = await db["Webinar_Video"].count_documents({})
    
    print(f"  Webinar_Concept collection exists: {wc_exists}")
    print(f"  Webinar_Concept document count: {wc_count}")
    print(f"  Webinar_Video collection exists: {wv_exists}")
    print(f"  Webinar_Video document count: {wv_count}")

    print("\n" + "=" * 60)
    print("SEEDING COMPLETE!")
    print("=" * 60)
    print("Both collections now have data. Refresh MongoDB Compass to see:")
    print("  - Webinar_Concept: approved concept with S3 link")
    print("  - Webinar_Video: video record with script S3 link")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_collections())
