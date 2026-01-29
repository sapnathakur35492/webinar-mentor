from fastapi import APIRouter, HTTPException, File, UploadFile, Body, Depends
from typing import List, Optional
from api import models, schemas
from api.utils import extract_text_from_file
from beanie import PydanticObjectId
from datetime import datetime

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

@router.post("/upload", response_model=schemas.InputArtifact)
async def upload_document(
    mentor_id: str = Body(..., embed=True),
    document_type: str = Body(..., embed=True), # onboarding | hook_analysis | transcript
    file: UploadFile = File(...)
):
    """
    Strict API: POST /api/documents/upload
    """
    if document_type not in ["onboarding", "hook_analysis", "transcript", "optional"]:
        raise HTTPException(status_code=400, detail="Invalid document type")

    # Validation: File size/format checking
    filename = file.filename.lower()
    if not (filename.endswith('.pdf') or filename.endswith('.docx') or filename.endswith('.txt')):
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, or TXT.")

    mentor = await models.Mentor.get(PydanticObjectId(mentor_id))
    if not mentor:
         raise HTTPException(status_code=404, detail="Mentor not found")

    text = await extract_text_from_file(file)
    if not text or len(text.strip()) < 100:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from file (min 100 characters)")

    # Save to UploadedDocument collection (History)
    doc_version_count = await models.UploadedDocument.find(
        models.UploadedDocument.mentor_id == mentor_id,
        models.UploadedDocument.document_type == document_type
    ).count()

    # Find or create project
    project = await models.Project.find_one(models.Project.mentor_id == mentor_id)
    
    new_doc = models.UploadedDocument(
        mentor_id=mentor_id,
        project_id=str(project.id) if project else None,
        document_type=document_type,
        file_name=file.filename,
        extracted_text=text,
        version=doc_version_count + 1
    )
    await new_doc.insert()

    # Update InputArtifact (Current State)
    inputs = await models.InputArtifact.find_one(models.InputArtifact.mentor_id == mentor_id)
    if not inputs:
        inputs = models.InputArtifact(
            mentor_id=mentor_id, 
            project_id=str(project.id) if project else "unknown"
        )
        
    if document_type == "onboarding":
        inputs.onboarding_doc_content = text
    elif document_type == "hook_analysis":
        inputs.hook_analysis_content = text
    elif document_type == "transcript":
        inputs.transcript_content = text
    
    inputs.updated_at = datetime.utcnow()
    await inputs.save()
    
    return inputs

@router.get("/{mentor_id}", response_model=List[models.UploadedDocument])
async def get_documents(mentor_id: str):
    docs = await models.UploadedDocument.find(models.UploadedDocument.mentor_id == mentor_id).sort("-uploaded_at").to_list()
    return docs

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    doc = await models.UploadedDocument.get(PydanticObjectId(document_id))
    if not doc:
        raise HTTPException(404, "Document not found")
        
    await doc.delete()
    return {"msg": "Document deleted"}
