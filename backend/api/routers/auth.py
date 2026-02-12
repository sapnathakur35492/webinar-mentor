from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from api import models, schemas
from core import security
from core.settings import settings
from datetime import timedelta
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
    return user

@router.post("/login", response_model=schemas.Token)
async def login(form_data: schemas.UserLogin):
    # Note: We are using a custom schema here instead of OAuth2PasswordRequestForm 
    # to match the JSON body {email, password} from frontend easily, 
    # but for strict OAuth2 compliant clients we might want OAuth2PasswordRequestForm
    
    user = await models.User.find_one({"email": form_data.email})
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
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
    }
