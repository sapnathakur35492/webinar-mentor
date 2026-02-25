from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from beanie import Document
from datetime import datetime
from enum import IntEnum

# --- ENUMS ---
class ConceptStatus(IntEnum):
    """Status enum for webinar concepts: Pending=0, Approved=1, Rejected=2"""
    Pending = 0
    Approved = 1
    Rejected = 2

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
    user_id: str = Field(default="", index=True)  # Links to User document
    FullName: str = ""
    Email: str = Field(default="", index=True)
    PasswordHash: str = ""
    Status: str = "active"
    CreatedDate: Optional[str] = Field(default=None)
    UpdatedDate: Optional[str] = None
    
    class Settings:
        name = "Mentors"

class OnboardingDocument(Document):
    MentorId: str = Field(index=True)
    FileName: str
    FileType: str
    S3Url: str
    UploadedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "Onboarding_document"

class WebinarConcept(Document):
    MentorId: str = Field(index=True)
    ConceptNumber: int = 1              # Which concept was approved (1, 2, or 3)
    ConceptTitle: str = ""              # Title of the concept
    ConceptData: Dict[str, Any] = {}    # Full approved concept data
    Status: int = ConceptStatus.Pending # 0=Pending, 1=Approved, 2=Rejected
    FileName: str = ""
    FileType: str = "application/json"
    S3Url: str = ""                     # S3 link (filled only on approval)
    UploadedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "Webinar_Concept"

class WebinarVideo(Document):
    MentorId: str = Field(index=True)
    TalkId: str = Field(default="")  # HeyGen/Gemini video ID for linking
    Script: str = ""  # The script text used in the video
    ScriptS3Url: str = ""  # S3 link for the script file
    VideoS3Url: str = ""  # S3 link for the video (filled when completed)
    VideoSourceUrl: str = ""  # Original HeyGen/Gemini URL
    Status: str = "pending"  # pending, completed, failed
    UploadedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "Webinar_Video"

class Concept(BaseModel):
    title: str
    big_idea: str
    hook: str
    structure_points: List[str]
    secrets: List[Dict[str, str]]  # {assumption, story, belief, transformation}
    mechanism: str
    narrative_angle: str
    offer_transition_logic: str
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
    preview_text: str
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
    concept_admin_notes: Optional[str] = None
    
    # Step 2: Structure
    structure_content: Optional[str] = None # Raw text from AI
    structure: List[Slide] = []
    structure_version: int = 1
    structure_admin_notes: Optional[str] = None
    
    # Step 3: Emails
    email_plan_content: Optional[str] = None # Raw strategy from AI
    email_plan: Optional[EmailPlan] = None
    email_version: int = 1
    email_admin_notes: Optional[str] = None
    
    video_status: str = "none" # none, pending, completed, failed
    
    # Step 5: Approval Status
    concept_approval_status: str = "draft" # draft, pending, approved, revision_requested
    structure_approval_status: str = "draft"
    email_approval_status: str = "draft"
    media_approval_status: str = "draft"

    # Step 4: Media Assets
    promotional_images: List[Dict[str, Any]] = [] # [{media_type, image_url, status, created_at}]
    video_url: Optional[str] = None
    video_talk_id: Optional[str] = None
    
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