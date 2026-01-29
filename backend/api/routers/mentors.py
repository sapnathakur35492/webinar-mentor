from fastapi import APIRouter, HTTPException, Body, File, UploadFile, Form
from typing import List
from api import models, schemas
from beanie import PydanticObjectId
# from api.services.audit_service import log_activity
async def log_activity(*args, **kwargs): pass

router = APIRouter(
    prefix="/mentors",
    tags=["mentors"]
)



@router.get("/user/{user_id}", response_model=schemas.Mentor)
async def get_mentor_by_user(user_id: str):
    mentor = await models.Mentor.find_one(models.Mentor.user_id == user_id)
    if not mentor:
         # Return empty/default if not found for setup flow? 
         # Or 404 and let frontend handle creation?
         # Better to return 404 so frontend knows to create or just return null?
         # FastAPI response_model expects a Mentor object.
         raise HTTPException(status_code=404, detail="Mentor profile not found")
    return mentor

@router.patch("/user/{user_id}", response_model=schemas.MentorResponse)
async def update_mentor_by_user(user_id: str, mentor_update: schemas.MentorCreate):
    try:
        mentor = await models.Mentor.find_one(models.Mentor.user_id == user_id)
        
        if not mentor:
            # UPSERT: Create new mentor profile
            print(f"DEBUG: Creating new mentor for user_id={user_id}")
            new_mentor = models.Mentor(
                user_id=user_id,
                name=mentor_update.name,
                email=mentor_update.email,
                full_name=mentor_update.full_name or mentor_update.name, # Fallback
                company_name=mentor_update.company_name,
                website_url=mentor_update.website_url,
                niche=mentor_update.niche,
                method_description=mentor_update.method_description,
                target_audience=mentor_update.target_audience,
                audience_pain_points=mentor_update.audience_pain_points,
                transformation_promise=mentor_update.transformation_promise,
                unique_mechanism=mentor_update.unique_mechanism,
                personal_story=mentor_update.personal_story,
                philosophy=mentor_update.philosophy,
                key_objections=mentor_update.key_objections,
                testimonials=mentor_update.testimonials,
                current_stage=mentor_update.current_stage or "onboarding"
            )
            # Ensure timestamps
            new_mentor.created_at = datetime.utcnow()
            new_mentor.updated_at = datetime.utcnow()
            
            await new_mentor.insert()
            return new_mentor
        
        # Update existing
        print(f"DEBUG: Updating existing mentor {mentor.id}")
        update_data = mentor_update.dict(exclude_unset=True)
        
        # Manually map update logic or use Beanie's update
        for key, value in update_data.items():
            if hasattr(mentor, key):
                setattr(mentor, key, value)
                
        mentor.updated_at = datetime.utcnow()
        
        # --- DATA HEALING: Populate missing legacy fields ---
        if not hasattr(mentor, "created_at") or not mentor.created_at:
            mentor.created_at = datetime.utcnow()
            
        if not hasattr(mentor, "status") or not mentor.status:
            mentor.status = "active"
            
        if not hasattr(mentor, "language_tone") or not mentor.language_tone:
            mentor.language_tone = "Norwegian"
            
        if not hasattr(mentor, "current_stage") or not mentor.current_stage:
            mentor.current_stage = "onboarding"
            
        if not hasattr(mentor, "name") or not mentor.name:
            mentor.name = mentor.full_name
            
        await mentor.save()
        return mentor
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"INTERNAL ERROR: {str(e)}")

# Original endpoints kept for admin/compatibility
@router.post("/", response_model=schemas.Mentor)
async def create_mentor(mentor: schemas.MentorCreate):
    # This might need user_id now? 
    # For now, let's assume this is legacy or admin only
    existing_mentor = await models.Mentor.find_one(models.Mentor.email == mentor.email)
    if existing_mentor:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # We need a user_id. Generally this endpoint would be called AFTER user creation.
    # If we don't have user_id, this model will fail validation.
    # So we should probably require user_id in MentorCreate if using this endpoint?
    # Or just rely on the PATCH /user/{user_id} endpoint for the main flow.
    pass

@router.get("/", response_model=List[schemas.Mentor])
async def read_mentors(skip: int = 0, limit: int = 100):
    mentors = await models.Mentor.find_all().skip(skip).limit(limit).to_list()
    return mentors

@router.get("/{mentor_id}", response_model=schemas.Mentor)
async def read_mentor(mentor_id: str):
    # We need to find by _id. 
    try:
        mentor = await models.Mentor.get(clean_id(mentor_id))
    except:
        mentor = None

    if mentor is None:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return mentor

@router.delete("/{mentor_id}")
async def delete_mentor(mentor_id: str):
    mentor = await models.Mentor.get(clean_id(mentor_id))
    if not mentor:
         raise HTTPException(status_code=404, detail="Mentor not found")
    await mentor.delete()
    return {"message": "Mentor deleted successfully"}

from api.services.file_storage import FileStorageService
from datetime import datetime
import base64
import binascii

@router.post("/{mentor_id}/inputs", response_model=schemas.InputArtifact)
async def upload_mentor_inputs(
    mentor_id: str,
    data: schemas.InputArtifactRequest
):
    mentor = await models.Mentor.get(clean_id(mentor_id))
    if not mentor:
         raise HTTPException(status_code=404, detail="Mentor not found")

    # Helper to process base64 file
    async def process_base64_file(base64_str: str, filename: str, content_type: str, manual_text: str):
        if base64_str:
            try:
                # Local instantiation
                service = FileStorageService()
                
                # Remove header if present (e.g. data:application/pdf;base64,)
                if "base64," in base64_str:
                    base64_str = base64_str.split("base64,")[1]
                
                content = base64.b64decode(base64_str)
                file_id, extracted_text = await service.upload_and_extract(
                    content, filename or "uploaded_file", content_type or "application/octet-stream"
                )
                return file_id, extracted_text
            except Exception as e:
                # Log error and fallback to manual text
                print(f"Error processing base64 file: {e}")
                return None, manual_text
        return None, manual_text

    onboarding_file_id, onboarding_text = await process_base64_file(
        data.onboarding_doc_base64, 
        data.onboarding_doc_filename, 
        data.onboarding_doc_type,
        data.onboarding_doc_text
    )
    
    hook_file_id, hook_text = await process_base64_file(
        data.hook_analysis_base64, 
        data.hook_analysis_filename, 
        data.hook_analysis_type,
        data.hook_analysis_text
    )
    
    transcript_file_id, transcript_text = await process_base64_file(
        data.transcript_base64, 
        data.transcript_filename, 
        data.transcript_type,
        data.transcript_text
    )

    # Check if inputs already exist
    db_inputs = await models.InputArtifact.find_one(models.InputArtifact.mentor_id == mentor_id)
    
    # Ensure Project exists
    project = await models.Project.find_one(models.Project.mentor_id == mentor_id)
    if not project:
        project = models.Project(
            mentor_id=mentor_id, 
            title=f"Project for {mentor.name}",
            current_stage="INPUTS",
            status="IN_PROGRESS"
        )
        await project.insert()
        
        # Initialize Stages with sub-stage support
        stages_data = [
            {"type": "CONCEPT", "name": "Concept Generation", "order": 1},
            {"type": "STRUCTURE", "name": "Webinar Structure", "order": 2},
            {"type": "EMAILS", "name": "Email Sequence", "order": 3}
        ]
        for s_data in stages_data:
            stage = models.Stage(
                project_id=str(project.id),
                stage_type=s_data["type"],
                stage_name=s_data["name"],
                stage_order=s_data["order"],
                status="PENDING",
                sub_stage="INITIAL",
                iteration_count=0
            )
            await stage.insert()

    project_id = str(project.id)

    if db_inputs:
        # Update existing
        db_inputs.project_id = project_id
        if onboarding_text:
            db_inputs.onboarding_doc_content = onboarding_text
        if onboarding_file_id:
            db_inputs.onboarding_doc_file_id = onboarding_file_id
        if hook_text:
            db_inputs.hook_analysis_content = hook_text
        if hook_file_id:
            db_inputs.hook_analysis_file_id = hook_file_id
        if transcript_text:
            db_inputs.transcript_content = transcript_text
        if transcript_file_id:
            if transcript_file_id not in db_inputs.transcript_file_ids:
                db_inputs.transcript_file_ids.append(transcript_file_id)
        db_inputs.updated_at = datetime.utcnow()
        await db_inputs.save()
        await log_activity(
            mentor_id=mentor_id, 
            action="DOCUMENTS_UPDATED", 
            performed_by="ADMIN"
        )
    else:
        # Create new
        db_inputs = models.InputArtifact(
            project_id=project_id,
            mentor_id=mentor_id,
            onboarding_doc_content=onboarding_text or "",
            hook_analysis_content=hook_text or "",
            transcript_content=transcript_text or "",
            onboarding_doc_file_id=onboarding_file_id,
            hook_analysis_file_id=hook_file_id,
            transcript_file_ids=[transcript_file_id] if transcript_file_id else []
        )
        await db_inputs.insert()

        await log_activity(
            mentor_id=mentor_id, 
            action="DOCUMENTS_UPLOADED", 
            performed_by="ADMIN"
        )
    
    return db_inputs

@router.get("/{mentor_id}/inputs", response_model=schemas.InputArtifact)
async def get_mentor_inputs(mentor_id: str):
    db_inputs = await models.InputArtifact.find_one(models.InputArtifact.mentor_id == mentor_id)
    if not db_inputs:
        raise HTTPException(status_code=404, detail="Inputs not found")
    return db_inputs

def clean_id(id_val: str):
    # Helper to handle ObjectId conversion if needed
    try:
        return PydanticObjectId(id_val)
    except:
        return id_val 
