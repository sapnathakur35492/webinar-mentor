from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from beanie import Document
from datetime import datetime

# --- SUB-MODELS ---
class User(Document):
    email: str = Field(index=True, unique=True)
    password_hash: str
    full_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    role: str = "user"  # user, admin
    
    class Settings:
        name = "webinar_users"

class Mentor(Document):
    user_id: str = Field(index=True, unique=True) # Link to User.id
    email: str = Field(index=True)
    name: str # Required by Schema
    full_name: str
    industry: Optional[str] = None
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
    
    # Status
    status: str = "active"
    language_tone: str = "Norwegian"
    
    # Progress link
    current_stage: str = "onboarding"
    stage_started_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "webinar_mentors"

class Concept(BaseModel):
    title: str
    big_idea: str
    hook: str
    structure_points: List[str]
    secrets: List[Dict[str, str]]  # {assumption, story, belief, transformation}
    mechanism: str
    value_anchor: Dict[str, List[str]] # "After this course..." or "My goal..."
    bonus_ideas: List[str]
    cta_sentence: str
    promises: List[str]
    # Evaluation fields
    evaluation_score: Optional[int] = None
    evaluation_notes: Optional[str] = None

class Slide(BaseModel):
    slide_number: int
    title: str
    description: str
    visual_visual: Optional[str] = None
    section: str # Intro, One Thing, Secret 1, etc.

class EmailDraft(BaseModel):
    day: str # D-3, D+1 etc.
    segment: str # Registered, No-Show, Attended
    purpose: str
    subject: str
    preheader: str
    body: str
    cta: str
    tone_analysis: Optional[str] = None

class EmailPlan(BaseModel):
    timeline: List[Dict[str, Any]] # Overview of days/segments
    emails: List[EmailDraft]
    strategy_notes: str

class InputArtifact(Document):
    project_id: str
    mentor_id: str = Field(index=True)
    onboarding_doc_content: str = ""
    hook_analysis_content: str = ""
    transcript_content: str = ""
    
    # File References (ids from GridFS or S3)
    onboarding_doc_file_id: Optional[str] = None
    hook_analysis_file_id: Optional[str] = None
    transcript_file_ids: List[str] = []
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "webinar_input_artifacts"

class Project(Document):
    mentor_id: str = Field(index=True)
    title: str
    current_stage: str
    status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "webinar_projects"

class Stage(Document):
    project_id: str = Field(index=True)
    stage_type: str
    stage_name: str
    stage_order: int
    status: str
    sub_stage: str
    iteration_count: int
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "webinar_stages"

# --- MAIN DOCUMENT ---

class WebinarAsset(Document):
    mentor_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Input Context
    onboarding_doc_content: Optional[str] = None
    hook_analysis_content: Optional[str] = None
    transcript_analysis: Optional[str] = None # From meeting with mentor
    
    # Step 1: Concepts
    concepts_original: List[Concept] = []
    concepts_evaluated: Optional[str] = None # Text critique
    concepts_improved: List[Concept] = []
    selected_concept: Optional[Concept] = None
    concept_version: int = 1
    concept_approval_status: str = "draft"  # draft, pending, approved, revision_requested
    concept_admin_notes: Optional[str] = None
    
    # Step 2: Structure
    structure_content: Optional[str] = None # Raw text from AI
    structure: List[Slide] = []
    structure_version: int = 1
    structure_approval_status: str = "draft"  # draft, pending, approved, revision_requested
    structure_admin_notes: Optional[str] = None
    
    # Step 3: Emails
    email_plan: Optional[EmailPlan] = None
    email_version: int = 1
    email_approval_status: str = "draft"  # draft, pending, approved, revision_requested
    email_admin_notes: Optional[str] = None
    
    class Settings:
        name = "webinar_assets"

class ApprovalHistory(Document):
    """Tracks all approval actions and version history for audit trail"""
    mentor_id: str = Field(index=True)
    asset_id: str = Field(index=True)
    content_type: str  # "concept", "structure", "email_sequence", "video"
    version: int = 1
    
    # Content snapshot at time of submission
    content_snapshot: Optional[Dict[str, Any]] = None
    
    # Approval workflow
    status: str = "pending"  # pending, approved, rejected, revision_requested
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None  # Admin user ID
    
    # Admin feedback
    admin_notes: Optional[str] = None
    revision_instructions: Optional[str] = None
    
    # Iteration tracking
    iteration_count: int = 1
    previous_version_id: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "webinar_approval_history"


class WebinarProcessingJob(Document):
    """Tracks background processing jobs for async PDF/AI operations"""
    mentor_id: str = Field(index=True)
    job_type: str  # "pdf_upload", "concept_generation", "structure_generation", "email_generation"
    status: str = "pending"  # pending, processing, completed, failed
    progress: int = 0  # 0-100
    message: str = "Job queued..."
    result_asset_id: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "webinar_processing_jobs"