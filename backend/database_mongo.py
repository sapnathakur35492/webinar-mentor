from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from api.models import WebinarAsset, User, Mentor, Project, Stage, InputArtifact, WebinarProcessingJob, ApprovalHistory
from core.settings import settings

async def init_db(client=None):
    if not client:
        # Use DATABASE_URL from settings (.env)
        uri = settings.DATABASE_URL
        client = AsyncIOMotorClient(uri)
    
    # Use fixed database name
    db_name = "change20_db"
    
    await init_beanie(database=client[db_name], document_models=[
        WebinarAsset, User, Mentor, Project, Stage, InputArtifact, WebinarProcessingJob, ApprovalHistory
    ])
