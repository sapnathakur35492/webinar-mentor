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

@router.post("/register")
async def register(user_in: schemas.UserCreate):
    collection_name = models.Mentor.get_settings().name
    print(f"DEBUG REGISTER: Received request - name={user_in.name}, email={user_in.email}")
    print(f"DEBUG REGISTER: Target Collection = {collection_name}")
    try:
        # --- Validation ---
        if not user_in.name or len(user_in.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
        if not user_in.password or len(user_in.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        if not user_in.email:
            raise HTTPException(status_code=400, detail="Email is required")

        # Check if email already exists in Mentors collection (simple lowercase match)
        email_lower = user_in.email.strip().lower()
        existing_mentor = await models.Mentor.find_one({"Email": email_lower})
        if not existing_mentor:
            # Also check legacy 'email' field for backward compatibility
            existing_mentor = await models.Mentor.find_one({"email": email_lower})
        
        if existing_mentor:
            print(f"DEBUG REGISTER: Email already exists - {email_lower}")
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        now = datetime.utcnow().isoformat() + "Z"
        
        # Create Mentor document in Mentors collection with only requested fields
        mentor = models.Mentor(
            FullName=user_in.name.strip(),
            Email=email_lower,
            PasswordHash=get_password_hash(user_in.password),
            Status="active",
            CreatedDate=now,
            UpdatedDate=None
        )
        await mentor.insert()
        print(f"DEBUG REGISTER: Document inserted with ID: {mentor.id}")
        
        print(f"DEBUG REGISTER: SUCCESS - mentor {mentor.id} - {mentor.FullName} ({mentor.Email})")

        return {
            "id": str(mentor.id),
            "Email": mentor.Email,
            "FullName": mentor.FullName,
            "CreatedDate": mentor.CreatedDate,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR REGISTER: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

@router.post("/login", response_model=schemas.Token)
async def login(form_data: schemas.UserLogin):
    # --- Validation ---
    if not form_data.email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not form_data.password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    # Find mentor by email (case-insensitive)
    mentor = await models.Mentor.find_one({"Email": {"$regex": f"^{form_data.email.strip()}$", "$options": "i"}})
    if not mentor or not mentor.PasswordHash or not verify_password(form_data.password, mentor.PasswordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(mentor.id)}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(mentor.id),
        "email": mentor.Email,
        "full_name": mentor.FullName,
        "mentor_id": str(mentor.id),
    }

