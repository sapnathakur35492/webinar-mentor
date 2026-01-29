from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from api import models, schemas
from core import security
from core.settings import settings
from beanie import PydanticObjectId

# This scheme expects the client to send "Authorization: Bearer <token>"
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.BASE_URL}/api/login"
)

async def get_current_user(token: str = Depends(reusable_oauth2)) -> models.User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = schemas.TokenData(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # In mock mode, we might not find a user if it was just seeded in memory or if we rely on dummy usage
    if settings.USE_MOCK_DB:
        # Mock logic: return a dummy admin user
        return models.User(
            id=PydanticObjectId(),
            name="Mock Admin", 
            email="admin@change20.com", 
            password_hash="mock", 
            role="admin"
        )

    if not token_data.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    try:
        user_id = PydanticObjectId(token_data.sub)
    except Exception:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token subject",
        )

    user = await models.User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    return current_user

