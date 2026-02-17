from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from api import models, schemas
from core import security
from core.settings import settings
from datetime import datetime, timedelta
from beanie import PydanticObjectId
from passlib.context import CryptContext

router = APIRouter(tags=["auth"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/register", response_model=schemas.User)
async def register(user_in: schemas.UserCreate):
    # --- Validation ---
    if not user_in.name or len(user_in.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    if not user_in.password or len(user_in.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if not user_in.email:
        raise HTTPException(status_code=400, detail="Email is required")

    existing_user = await models.User.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    user = models.User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.name,
        role="user"
    )
    await user.insert()

    # --- Auto-create Mentor profile linked by user_id ---
    try:
        mentor = models.Mentor(
            user_id=str(user.id),
            email=user_in.email,
            name=user_in.name,
            full_name=user_in.name,
            current_stage="onboarding",
            status="active",
            language_tone="Norwegian",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        await mentor.insert()
        print(f"DEBUG: Auto-created mentor profile {mentor.id} for user {user.id}")
    except Exception as e:
        print(f"WARNING: Failed to auto-create mentor profile: {e}")
        # Don't fail registration if mentor creation fails — it can be created later via PATCH

    return user

@router.post("/login", response_model=schemas.Token)
async def login(form_data: schemas.UserLogin):
    # --- Validation ---
    if not form_data.email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not form_data.password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    user = await models.User.find_one({"email": form_data.email})
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Find linked mentor profile
    mentor = await models.Mentor.find_one(models.Mentor.user_id == str(user.id))
    mentor_id = str(mentor.id) if mentor else None

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "mentor_id": mentor_id,
    }
