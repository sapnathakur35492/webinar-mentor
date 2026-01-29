from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId

class MentorBase(BaseModel):
    name: Optional[str] = None # Matches 'full_name' from frontend usually, or use full_name alias
    email: EmailStr
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    website_url: Optional[str] = None
    niche: Optional[str] = None
    method_description: Optional[str] = None
    target_audience: Optional[str] = None
    audience_pain_points: Optional[str] = None
    transformation_promise: Optional[str] = None
    unique_mechanism: Optional[str] = None
    personal_story: Optional[str] = None
    philosophy: Optional[str] = None
    key_objections: Optional[str] = None
    testimonials: Optional[str] = None
    current_stage: Optional[str] = "onboarding"

class MentorCreate(MentorBase):
    industry: Optional[str] = None
    language_tone: Optional[str] = "Norwegian"
    status: Optional[str] = "active"

class Mentor(MentorBase):
    id: PydanticObjectId
    industry: Optional[str] = None
    language_tone: str = "Norwegian"
    status: str = "active"
    current_stage: str = "onboarding"
    stage_started_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MentorResponse(MentorBase):
    id: PydanticObjectId
    name: Optional[str] = None
    industry: Optional[str] = None
    language_tone: str = "Norwegian"
    status: str = "active"
    current_stage: str = "onboarding"
    stage_started_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Kept for compatibility but not primary anymore
class ConceptBase(BaseModel):
    big_idea: Optional[str] = None
    hooks: Optional[str] = None
    structure_secret: Optional[str] = None
    mechanism: Optional[str] = None
    narrative_angle: Optional[str] = None
    status: str = "draft"
    ai_feedback: Optional[str] = None

class ConceptCreate(ConceptBase):
    pass

class Concept(ConceptBase):
    id: PydanticObjectId
    mentor_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str
    current_stage: str = "INPUTS"
    status: str = "IN_PROGRESS"

class ProjectCreate(ProjectBase):
    mentor_id: str

class Project(ProjectBase):
    id: PydanticObjectId
    mentor_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class StageBase(BaseModel):
    stage_type: str
    status: str = "PENDING"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None

class Stage(StageBase):
    id: PydanticObjectId
    project_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProjectVersionBase(BaseModel):
    version_number: int
    content: Dict[str, Any]
    created_by: str = "AI"
    feedback_used: Optional[str] = None

class ProjectVersionCreate(ProjectVersionBase):
    project_id: str
    stage_id: str

class ProjectVersion(ProjectVersionBase):
    id: PydanticObjectId
    project_id: str
    stage_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class InputArtifactBase(BaseModel):
    onboarding_doc_content: Optional[str] = None
    hook_analysis_content: Optional[str] = None
    transcript_content: Optional[str] = None

class InputArtifactCreate(InputArtifactBase):
    pass

class InputArtifact(InputArtifactBase):
    id: PydanticObjectId
    project_id: str # Updated to link to Project
    mentor_id: str
    updated_at: datetime
    files_metadata: List[Dict] = []

    class Config:
        from_attributes = True

class InputArtifactRequest(BaseModel):
    onboarding_doc_text: Optional[str] = None
    onboarding_doc_base64: Optional[str] = None
    onboarding_doc_filename: Optional[str] = None
    onboarding_doc_type: Optional[str] = None
    
    hook_analysis_text: Optional[str] = None
    hook_analysis_base64: Optional[str] = None
    hook_analysis_filename: Optional[str] = None
    hook_analysis_type: Optional[str] = None
    
    transcript_text: Optional[str] = None
    transcript_base64: Optional[str] = None
    transcript_filename: Optional[str] = None
    transcript_type: Optional[str] = None

class StructureBase(BaseModel):
    slides_json: Optional[str] = None
    status: str = "draft"

class StructureCreate(StructureBase):
    pass

class Structure(StructureBase):
    id: PydanticObjectId
    mentor_id: str
    concept_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class EmailSequenceBase(BaseModel):
    sequence_json: Optional[str] = None
    status: str = "draft"

class EmailSequenceCreate(EmailSequenceBase):
    pass

class EmailSequence(EmailSequenceBase):
    id: PydanticObjectId
    mentor_id: str
    structure_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Auth & User Schemas ---

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    name: str  # Frontend sends 'name', maps to full_name in model
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: PydanticObjectId
    email: EmailStr
    full_name: str  # Match the model field
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    sub: Optional[str] = None

# --- Audit Schemas ---

class AuditLogBase(BaseModel):
    mentor_id: Optional[str] = None
    action: str
    stage: Optional[str] = None
    performed_by: str

class AuditLogCreate(AuditLogBase):
    pass

class AuditLog(AuditLogBase):
    id: PydanticObjectId
    timestamp: datetime

    class Config:
        from_attributes = True
