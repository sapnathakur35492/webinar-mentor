from fastapi import APIRouter, HTTPException, Body, File, UploadFile, Form
from typing import Dict, Any, Optional
import json
from api import models, schemas
from api.services.ai_service import ai_service
from api.services.file_storage import FileStorageService
from beanie import PydanticObjectId
from datetime import datetime

router = APIRouter(
    prefix="/ai",
    tags=["ai"]
)

# Helper to get Project and Stage
async def get_project_and_stage(mentor_id: str, stage_type: str):
    project = await models.Project.find_one(models.Project.mentor_id == mentor_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    stage = await models.Stage.find_one(
        models.Stage.project_id == str(project.id), 
        models.Stage.stage_type == stage_type
    )
    if not stage:
        raise HTTPException(status_code=404, detail=f"{stage_type} Stage not found")
        
    return project, stage

# --- CONCEPT WORKFLOW ---

@router.post("/generate-concept")
async def generate_concept(mentor_id: str = Body(..., embed=True)):
    """
    Step 1: Generate 3 webinar concepts (INITIAL sub-stage)
    """
    try:
        inputs = await models.InputArtifact.find_one(models.InputArtifact.mentor_id == mentor_id)
        if not inputs or not inputs.onboarding_doc_content:
            raise HTTPException(400, "Onboarding document required")
       
        mentor = await models.Mentor.get(PydanticObjectId(mentor_id))
        if not mentor:
            raise HTTPException(404, "Mentor not found")
    
        project, stage = await get_project_and_stage(mentor_id, "CONCEPT")
    
        # Generate 3 concepts
        onboarding = inputs.onboarding_doc_content or ""
        hook_analysis = inputs.hook_analysis_content or ""
        
        concepts = await ai_service.generate_concept(
            mentor.name, 
            mentor.industry or "General", 
            onboarding, 
            hook_analysis
        )
    
        # Save as AIOutput
        ai_output = models.AIOutput(
            project_id=str(project.id),
            stage_id=str(stage.id),
            mentor_id=mentor_id,
            output_type="concept",
            version_number=1,
            concepts=[concepts.get("concept_1"), concepts.get("concept_2"), concepts.get("concept_3")],
            generated_output=concepts,
            created_by="AI"
        )
        await ai_output.insert()
        
        # Update stage
        stage.status = "IN_PROGRESS"
        stage.sub_stage = "INITIAL"
        stage.iteration_count = 1
        await stage.save()
    
        return {
            "id": str(ai_output.id),
            "concepts": ai_output.concepts,
            "sub_stage": "INITIAL"
        }
    except Exception as e:
        import traceback
        with open("ai_error.log", "w") as f:
            f.write(f"Error in generate_concept: {e}\n")
            f.write(traceback.format_exc())
        raise

@router.post("/evaluate-concepts")
async def evaluate_concepts(mentor_id: str = Body(..., embed=True)):
    """
    Step 2: Self-evaluate concepts (SELF_EVAL sub-stage)
    """
    project, stage = await get_project_and_stage(mentor_id, "CONCEPT")
    
    # Get latest concepts
    latest_output = await models.AIOutput.find_one(
        models.AIOutput.stage_id == str(stage.id),
        models.AIOutput.output_type == "concept"
    )
    if not latest_output:
        raise HTTPException(400, "No concepts to evaluate")
    
    # Evaluate
    evaluation = await ai_service.evaluate_concepts(latest_output.generated_output)
    
    # Update AIOutput
    latest_output.self_review_output = evaluation
    await latest_output.save()
    
    # Update stage
    stage.sub_stage = "SELF_EVAL"
    stage.iteration_count += 1
    stage.evaluation_scores = evaluation.get("scores", {})
    await stage.save()
    
    return {
        "evaluation": evaluation,
        "sub_stage": "SELF_EVAL"
    }

@router.post("/improve-concepts")
async def improve_concepts(mentor_id: str = Body(..., embed=True)):
    """
    Step 3: Improve concepts based on evaluation (IMPROVED sub-stage)
    """
    project, stage = await get_project_and_stage(mentor_id, "CONCEPT")
    
    # Get latest output with evaluation
    latest_output = await models.AIOutput.find_one(
        models.AIOutput.stage_id == str(stage.id),
        models.AIOutput.output_type == "concept"
    )
    if not latest_output or not latest_output.self_review_output:
        raise HTTPException(400, "No evaluation found")
    
    # Improve
    improved_concepts = await ai_service.improve_concepts(
        latest_output.generated_output,
        latest_output.self_review_output
    )
    
    # Update AIOutput
    latest_output.final_output = improved_concepts
    latest_output.concepts = [
        improved_concepts.get("concept_1"),
        improved_concepts.get("concept_2"),
        improved_concepts.get("concept_3")
    ]
    await latest_output.save()
    
    # Update stage
    stage.sub_stage = "IMPROVED"
    stage.iteration_count += 1
    await stage.save()
    
    return {
        "concepts": latest_output.concepts,
        "sub_stage": "IMPROVED"
    }

@router.post("/refine-with-transcript")
async def refine_with_transcript(
    mentor_id: str = Form(...),
    transcript: UploadFile = File(None),
    transcript_text: str = Form(None)
):
    """
    Step 4: Refine concepts with mentor feedback transcript (MENTOR_FEEDBACK sub-stage)
    """
    project, stage = await get_project_and_stage(mentor_id, "CONCEPT")
    
    # Get transcript text
    if transcript:
        content = await transcript.read()
        file_id, transcript_text = await file_storage_service.upload_and_extract(
            content, transcript.filename, transcript.content_type
        )
    
    if not transcript_text:
        raise HTTPException(400, "Transcript required")
    
    # Get latest output
    latest_output = await models.AIOutput.find_one(
        models.AIOutput.stage_id == str(stage.id),
        models.AIOutput.output_type == "concept"
    )
    if not latest_output:
        raise HTTPException(400, "No concepts found")
    
    # Refine with transcript
    refined_concepts = await ai_service.refine_with_transcript(
        latest_output.final_output or latest_output.generated_output,
        transcript_text
    )
    
    # Update AIOutput
    latest_output.final_output = refined_concepts
    latest_output.transcript_feedback = transcript_text
    latest_output.concepts = [
        refined_concepts.get("concept_1"),
        refined_concepts.get("concept_2"),
        refined_concepts.get("concept_3")
    ]
    await latest_output.save()
    
    # Update stage
    stage.sub_stage = "MENTOR_FEEDBACK"
    stage.iteration_count += 1
    await stage.save()
    
    return {
        "concepts": latest_output.concepts,
        "sub_stage": "MENTOR_FEEDBACK"
    }

# --- STRUCTURE WORKFLOW ---

@router.post("/generate-structure")
async def generate_structure(mentor_id: str = Body(..., embed=True)):
    """
    Generate slide-by-slide structure
    """
    project, stage = await get_project_and_stage(mentor_id, "STRUCTURE")
    
    # Get approved concept
    concept_stage = await models.Stage.find_one(
        models.Stage.project_id == str(project.id),
        models.Stage.stage_type == "CONCEPT"
    )
    if concept_stage.status != "APPROVED":
        raise HTTPException(400, "Concept must be approved first")
    
    concept_output = await models.AIOutput.find_one(
        models.AIOutput.stage_id == str(concept_stage.id),
        models.AIOutput.output_type == "concept"
    )
    if not concept_output:
        raise HTTPException(400, "No concept found")
    
    # Generate structure
    structure = await ai_service.generate_slide_structure(
        concept_output.final_output or concept_output.generated_output
    )
    
    # Save AIOutput
    ai_output = models.AIOutput(
        project_id=str(project.id),
        stage_id=str(stage.id),
        mentor_id=mentor_id,
        output_type="structure",
        version_number=1,
        webinar_structure=structure,
        generated_output=structure,
        created_by="AI"
    )
    await ai_output.insert()
    
    # Update stage
    stage.status = "IN_PROGRESS"
    stage.sub_stage = "INITIAL"
    stage.iteration_count = 1
    await stage.save()
    
    return {
        "id": str(ai_output.id),
        "structure": structure,
        "sub_stage": "INITIAL"
    }

@router.post("/update-structure-with-transcript")
async def update_structure_with_transcript(
    mentor_id: str = Form(...),
    transcript: UploadFile = File(None),
    transcript_text: str = Form(None)
):
    """
    Update structure with mentor feedback
    """
    project, stage = await get_project_and_stage(mentor_id, "STRUCTURE")
    
    # Get transcript
    if transcript:
        content = await transcript.read()
        # Local instantiation
        file_service = FileStorageService()
        file_id, transcript_text = await file_service.upload_and_extract(
            content, transcript.filename, transcript.content_type
        )
    
    if not transcript_text:
        raise HTTPException(400, "Transcript required")
    
    # Get latest structure
    latest_output = await models.AIOutput.find_one(
        models.AIOutput.stage_id == str(stage.id),
        models.AIOutput.output_type == "structure"
    )
    if not latest_output:
        raise HTTPException(400, "No structure found")
    
    # Update with transcript
    updated_structure = await ai_service.update_structure_with_transcript(
        latest_output.webinar_structure,
        transcript_text
    )
    
    # Update AIOutput
    latest_output.final_output = updated_structure
    latest_output.webinar_structure = updated_structure
    latest_output.transcript_feedback = transcript_text
    await latest_output.save()
    
    # Update stage
    stage.sub_stage = "MENTOR_FEEDBACK"
    stage.iteration_count += 1
    await stage.save()
    
    return {
        "structure": updated_structure,
        "sub_stage": "MENTOR_FEEDBACK"
    }

# --- EMAIL WORKFLOW ---

@router.post("/generate-email-overview")
async def generate_email_overview(mentor_id: str = Body(..., embed=True)):
    """
    Generate email sequence overview
    """
    project, stage = await get_project_and_stage(mentor_id, "EMAILS")
    
    # Get approved structure
    structure_stage = await models.Stage.find_one(
        models.Stage.project_id == str(project.id),
        models.Stage.stage_type == "STRUCTURE"
    )
    if structure_stage.status != "APPROVED":
        raise HTTPException(400, "Structure must be approved first")
    
    structure_output = await models.AIOutput.find_one(
        models.AIOutput.stage_id == str(structure_stage.id),
        models.AIOutput.output_type == "structure"
    )
    
    # Generate overview
    overview = await ai_service.generate_email_sequence_overview({
        "structure": structure_output.webinar_structure if structure_output else {}
    })
    
    return {"overview": overview}

@router.post("/generate-emails")
async def generate_emails(
    mentor_id: str = Body(..., embed=True),
    overview: Dict[str, Any] = Body(..., embed=True)
):
    """
    Generate complete email sequence
    """
    project, stage = await get_project_and_stage(mentor_id, "EMAILS")
    
    # Generate emails
    emails = await ai_service.generate_email_sequence(overview)
    
    # Save AIOutput
    ai_output = models.AIOutput(
        project_id=str(project.id),
        stage_id=str(stage.id),
        mentor_id=mentor_id,
        output_type="email_sequence",
        version_number=1,
        email_sequences=emails,
        generated_output=emails,
        created_by="AI"
    )
    await ai_output.insert()
    
    # Update stage
    stage.status = "IN_PROGRESS"
    stage.sub_stage = "INITIAL"
    stage.iteration_count = 1
    await stage.save()
    
    return {
        "id": str(ai_output.id),
        "emails": emails,
        "sub_stage": "INITIAL"
    }

@router.post("/evaluate-emails")
async def evaluate_emails(mentor_id: str = Body(..., embed=True)):
    """
    Self-evaluate email sequence
    """
    project, stage = await get_project_and_stage(mentor_id, "EMAILS")
    
    # Get latest emails
    latest_output = await models.AIOutput.find_one(
        models.AIOutput.stage_id == str(stage.id),
        models.AIOutput.output_type == "email_sequence"
    )
    if not latest_output:
        raise HTTPException(400, "No emails to evaluate")
    
    # Evaluate
    evaluation = await ai_service.evaluate_emails(latest_output.email_sequences)
    
    # Update AIOutput
    latest_output.self_review_output = evaluation
    await latest_output.save()
    
    # Update stage
    stage.sub_stage = "SELF_EVAL"
    stage.iteration_count += 1
    await stage.save()
    
    return {
        "evaluation": evaluation,
        "sub_stage": "SELF_EVAL"
    }

@router.post("/improve-emails")
async def improve_emails(mentor_id: str = Body(..., embed=True)):
    """
    Improve emails based on evaluation
    """
    project, stage = await get_project_and_stage(mentor_id, "EMAILS")
    
    # Get latest output
    latest_output = await models.AIOutput.find_one(
        models.AIOutput.stage_id == str(stage.id),
        models.AIOutput.output_type == "email_sequence"
    )
    if not latest_output or not latest_output.self_review_output:
        raise HTTPException(400, "No evaluation found")
    
    # Improve
    improved_emails = await ai_service.improve_emails(
        latest_output.email_sequences,
        latest_output.self_review_output
    )
    
    # Update AIOutput
    latest_output.final_output = improved_emails
    latest_output.email_sequences = improved_emails
    await latest_output.save()
    
    # Update stage
    stage.sub_stage = "IMPROVED"
    stage.iteration_count += 1
    await stage.save()
    
    return {
        "emails": improved_emails,
        "sub_stage": "IMPROVED"
    }

# --- UTILITY ENDPOINTS ---

@router.get("/stage-status/{mentor_id}/{stage_type}")
async def get_stage_status(mentor_id: str, stage_type: str):
    """
    Get current stage status and sub-stage
    """
    project, stage = await get_project_and_stage(mentor_id, stage_type)
    
    return {
        "stage_type": stage.stage_type,
        "status": stage.status,
        "sub_stage": stage.sub_stage,
        "iteration_count": stage.iteration_count,
        "evaluation_scores": stage.evaluation_scores
    }
