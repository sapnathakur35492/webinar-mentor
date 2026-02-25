
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
from api import models, schemas
from core.s3 import s3_service
from datetime import datetime

router = APIRouter(tags=["documents"])

@router.post("/upload", response_model=schemas.OnboardingDocumentResponse)
async def upload_document(
    mentor_id: str,
    file: UploadFile = File(...)
):
    """
    Upload a document to S3 and save its metadata to MongoDB.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Upload to S3
        url = await s3_service.upload_file(
            file_content=content,
            file_name=file.filename,
            content_type=file.content_type
        )
        
        # Save to MongoDB
        doc = models.OnboardingDocument(
            MentorId=mentor_id,
            FileName=file.filename,
            FileType=file.content_type,
            S3Url=url,
            UploadedAt=datetime.utcnow()
        )
        await doc.insert()
        
        return doc
        
    except Exception as e:
        print(f"Error in upload_document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@router.get("/mentor/{mentor_id}", response_model=List[schemas.OnboardingDocumentResponse])
async def get_mentor_documents(mentor_id: str):
    """
    Get all documents for a specific mentor.
    """
    docs = await models.OnboardingDocument.find(models.OnboardingDocument.MentorId == mentor_id).to_list()
    return docs

@router.get("/concepts/{mentor_id}")
async def get_mentor_concepts(mentor_id: str):
    """
    Get all webinar concepts for a specific mentor from Webinar_Concept collection.
    """
    concepts = await models.WebinarConcept.find(models.WebinarConcept.MentorId == mentor_id).to_list()
    return [
        {
            "id": str(c.id),
            "MentorId": c.MentorId,
            "ConceptNumber": c.ConceptNumber,
            "ConceptTitle": c.ConceptTitle,
            "ConceptData": c.ConceptData,
            "Status": c.Status,  # 0=Pending, 1=Approved, 2=Rejected
            "FileName": c.FileName,
            "FileType": c.FileType,
            "S3Url": c.S3Url,
            "UploadedAt": c.UploadedAt.isoformat() if c.UploadedAt else None,
        }
        for c in concepts
    ]

@router.get("/videos/{mentor_id}")
async def get_mentor_videos(mentor_id: str):
    """
    Get all webinar videos for a specific mentor from Webinar_Video collection.
    """
    videos = await models.WebinarVideo.find(models.WebinarVideo.MentorId == mentor_id).to_list()
    return [
        {
            "id": str(v.id),
            "MentorId": v.MentorId,
            "TalkId": v.TalkId,
            "Script": v.Script[:200] + "..." if len(v.Script) > 200 else v.Script,
            "ScriptS3Url": v.ScriptS3Url,
            "VideoS3Url": v.VideoS3Url,
            "VideoSourceUrl": v.VideoSourceUrl,
            "Status": v.Status,
            "UploadedAt": v.UploadedAt.isoformat() if v.UploadedAt else None,
        }
        for v in videos
    ]
