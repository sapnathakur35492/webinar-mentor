from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from api.models import WebinarAsset, User, Mentor, Project, Stage, InputArtifact, WebinarProcessingJob, ApprovalHistory, OnboardingDocument, WebinarConcept, WebinarVideo
from core.settings import settings

async def init_db(client=None):
    if not client:
        # Use DATABASE_URL from settings (.env)
        uri = settings.DATABASE_URL
        print(f"DEBUG: Initializing DB with URI: {uri[:20]}...{uri[-10:]}")
        client = AsyncIOMotorClient(uri)
    
    # Use fixed database name
    db_name = "Change20-Dev"
    print(f"DEBUG: Using database: {db_name}")
    
    await init_beanie(database=client[db_name], document_models=[
        WebinarAsset, User, Mentor, Project, Stage, InputArtifact, WebinarProcessingJob, ApprovalHistory, OnboardingDocument, WebinarConcept, WebinarVideo
    ])
    print(f"DEBUG: Beanie initialized with models. Mentor collection: {Mentor.get_settings().name}")
