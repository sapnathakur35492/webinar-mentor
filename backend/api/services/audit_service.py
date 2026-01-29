from api import models
from datetime import datetime
from api import schemas
from beanie import PydanticObjectId
from core.settings import settings

async def log_activity(mentor_id: str, action: str, performed_by: str, stage: str = None):
    if settings.USE_MOCK_DB:
        print(f"MOCK AUDIT: {action} by {performed_by} for {mentor_id}")
        return

    log = models.ActivityLog(
        mentor_id=mentor_id,
        action=action,
        stage=stage,
        performed_by=performed_by,
        timestamp=datetime.utcnow()
    )
    await log.insert()
