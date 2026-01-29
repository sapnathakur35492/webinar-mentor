from fastapi import APIRouter, HTTPException, Body, File, UploadFile, Form, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from api.services.webinar_ai import webinar_ai_service
from api.services.background_processor import background_processor
from api.models import WebinarProcessingJob
from datetime import datetime

router = APIRouter()

class TranscriptUpdateRequest(BaseModel):
    asset_id: str
    transcript: str

class GenerateRequest(BaseModel):
    asset_id: str
    # Context usually fetched from DB, but allow overrides if needed
# class ContextUploadRequest(BaseModel): ...

@router.post("/upload-context")
async def upload_context(
    background_tasks: BackgroundTasks,
    mentor_id: str = Form(...),
    onboarding_doc: str = Form(...),
    hook_analysis: str = Form(...),
    file: UploadFile = File(None)
):
    """
    Upload PDF context and process in background.
    Returns immediately with job_id for status polling.
    """
    try:
        # Read file bytes before returning response
        file_bytes = None
        filename = None
        if file:
            filename = file.filename
            file_bytes = await file.read()

        # Create job record immediately
        job = WebinarProcessingJob(
            mentor_id=mentor_id,
            job_type="pdf_upload",
            status="pending",
            progress=5,
            message="PDF received. Starting background processing..."
        )
        await job.save()
        
        # Queue background task (runs AFTER response is sent)
        background_tasks.add_task(
            background_processor.process_pdf_upload,
            str(job.id),
            mentor_id,
            onboarding_doc,
            hook_analysis,
            file_bytes,
            filename
        )
        
        # Return immediately - don't wait for processing!
        return {
            "status": "accepted",
            "job_id": str(job.id),
            "message": "📄 PDF uploaded successfully! Processing in background. Please wait 1-2 minutes..."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    """
    Get status of a background processing job.
    Frontend should poll this endpoint every 5 seconds.
    """
    try:
        job = await WebinarProcessingJob.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "job_id": str(job.id),
            "status": job.status,
            "progress": job.progress,
            "message": job.message,
            "asset_id": job.result_asset_id,
            "error": job.error,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/concepts/generate")
async def generate_concepts(request: GenerateRequest):
    try:
        result = await webinar_ai_service.generate_concepts_chain(request.asset_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/concepts/update-from-meeting")
async def update_concept(request: TranscriptUpdateRequest):
    try:
        updated_concept = await webinar_ai_service.update_concept_with_transcript(
            request.asset_id, 
            request.transcript
        )
        return {"status": "success", "updated_concept": updated_concept}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SelectConceptRequest(BaseModel):
    concept_index: int
    from_improved: bool = True

@router.post("/assets/{asset_id}/select-concept")
async def select_concept(asset_id: str, request: SelectConceptRequest):
    try:
        from api.models import WebinarAsset
        asset = await WebinarAsset.get(asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        source_list = asset.concepts_improved if request.from_improved else asset.concepts_original
        
        if not source_list or request.concept_index >= len(source_list):
            raise HTTPException(status_code=400, detail="Invalid concept index")
            
        asset.selected_concept = source_list[request.concept_index]
        await asset.save()
        
        return {"status": "success", "selected_concept": asset.selected_concept}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/structure/generate")
async def generate_structure(request: GenerateRequest, concept_text: str = Body(..., embed=True)):
    try:
        structure = await webinar_ai_service.generate_structure(request.asset_id, concept_text)
        return {"status": "success", "structure": structure}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class EmailGenerateRequest(BaseModel):
    asset_id: str
    structure_text: str
    product_details: str

@router.post("/emails/generate")
async def generate_emails(request: EmailGenerateRequest):
    try:
        emails = await webinar_ai_service.generate_email_plan(
            request.asset_id, 
            request.structure_text, 
            request.product_details
        )
        return {"status": "success", "email_plan": emails, "data": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SingleEmailRequest(BaseModel):
    email_outline: str
    concept_context: str

@router.post("/emails/generate-single")
async def generate_single_email(request: SingleEmailRequest):
    try:
        result = await webinar_ai_service.generate_single_email_chain(
            request.email_outline, 
            request.concept_context
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assets/{asset_id}")
async def get_asset(asset_id: str):
    try:
        from api.models import WebinarAsset
        from beanie import PydanticObjectId
        
        # Validate ObjectId format
        try:
            obj_id = PydanticObjectId(asset_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
        
        asset = await WebinarAsset.get(obj_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Webinar asset not found")
        
        return asset
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error fetching asset: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

class VideoGenerateRequest(BaseModel):
    asset_id: Optional[str] = None
    script_text: Optional[str] = None
    source_url: Optional[str] = None

@router.post("/video/generate")
async def generate_video(request: VideoGenerateRequest):
    try:
        from api.services.did_service import did_service
        text = request.script_text
        
        # If asset_id provided AND no script_text, attempt to fetch from structure
        if request.asset_id and not text:
            from api.models import WebinarAsset
            asset = await WebinarAsset.get(request.asset_id)
            if asset and asset.structure_content:
                text = asset.structure_content[:500]
        
        if not text:
             raise HTTPException(status_code=400, detail="No script text provided or found in asset")

        # Allow source_url override from request, otherwise use service default
        source_url = getattr(request, "source_url", None)
        result = did_service.create_talk(text, source_url=source_url) if source_url else did_service.create_talk(text)
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create video with D-ID")
            
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video/{talk_id}")
async def get_video_status(talk_id: str):
    try:
        from api.services.did_service import did_service
        result = did_service.get_talk(talk_id)
        if not result:
             raise HTTPException(status_code=404, detail="Talk not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PromotionalImageRequest(BaseModel):
    concept_id: str
    media_type: str  # e.g., "registration_hero", "social_ad", "email_header"
    concept_text: Optional[str] = None

@router.post("/images/generate")
async def generate_promotional_image(request: PromotionalImageRequest):
    """
    Generate promotional images using DALL-E based on webinar concept
    """
    try:
        import openai
        import os
        from api.models import WebinarAsset, Concept
        
        # Get the asset/concept details - with better error handling
        concept_text = request.concept_text or "professional business webinar"
        
        try:
            asset = await WebinarAsset.get(request.concept_id)
            if asset and asset.selected_concept:
                # FIX: selected_concept is a Concept object, not a dict
                # Access attributes directly, not with .get()
                concept_obj = asset.selected_concept
                if isinstance(concept_obj, dict):
                    # If it's stored as dict
                    big_idea = concept_obj.get("big_idea", "")
                    hook = concept_obj.get("hook", "")
                else:
                    # If it's a Concept object
                    big_idea = getattr(concept_obj, "big_idea", "")
                    hook = getattr(concept_obj, "hook", "")
                
                if big_idea or hook:
                    concept_text = f"{big_idea}. {hook}".strip(". ")
        except Exception as e:
            # If asset not found, use provided concept_text or fallback
            print(f"Warning: Could not fetch asset {request.concept_id}: {str(e)}")
            pass  # Continue with fallback concept_text
        
        # Create image-specific prompts
        prompts = {
            "registration_hero": f"Create a professional, eye-catching hero banner image for a webinar landing page about: {concept_text}. Modern gradient design, clean and professional, 1920x1080",
            "social_ad": f"Create a bold, attention-grabbing social media ad image for a webinar about: {concept_text}. Square format, vibrant colors, text-free design, 1080x1080",
            "email_header": f"Create a clean email header banner for a webinar about: {concept_text}. Professional gradient, minimalist, 1200x400",
            "slide_title": f"Create a presentation title slide background for: {concept_text}. Professional gradient, corporate style, 1920x1080",
            "slide_content": f"Create a clean content slide background. Subtle pattern, professional, light background, 1920x1080",
            "thumbnail": f"Create a compelling video thumbnail for a webinar about: {concept_text}. Bold text-free design, eye-catching, 1280x720"
        }
        
        prompt = prompts.get(request.media_type, prompts["registration_hero"])
        
        # Check if OpenAI API key is set
        api_key = os.getenv("OPENAI_API_KEY")
        use_mock_mode = os.getenv("MOCK_IMAGE_MODE", "false").lower() == "true"
        
        # MOCK MODE for testing without OpenAI credits
        if use_mock_mode or not api_key:
            print("Using MOCK MODE for image generation (OpenAI disabled)")
            # Return placeholder images from picsum.photos
            mock_images = {
                "registration_hero": "https://picsum.photos/1920/1080?random=1",
                "social_ad": "https://picsum.photos/1080/1080?random=2",
                "email_header": "https://picsum.photos/1200/400?random=3",
                "slide_title": "https://picsum.photos/1920/1080?random=4",
                "slide_content": "https://picsum.photos/1920/1080?random=5",
                "thumbnail": "https://picsum.photos/1280/720?random=6"
            }
            
            return {
                "status": "success",
                "image_url": mock_images.get(request.media_type, mock_images["registration_hero"]),
                "media_type": request.media_type,
                "prompt_used": f"[MOCK MODE] {prompt}",
                "mock": True
            }
        
        # Generate image using DALL-E
        try:
            client = openai.OpenAI(api_key=api_key)
            
            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",  # DALL-E 3 default size
                quality="standard",
                n=1,
            )
            
            image_url = response.data[0].url
            
            return {
                "status": "success",
                "image_url": image_url,
                "media_type": request.media_type,
                "prompt_used": prompt
            }
        except openai.OpenAIError as oe:
            # If OpenAI fails (no credits, etc.), fall back to mock mode
            print(f"OpenAI API error: {str(oe)}")
            print("Falling back to MOCK MODE")
            
            mock_images = {
                "registration_hero": "https://picsum.photos/1920/1080?random=1",
                "social_ad": "https://picsum.photos/1080/1080?random=2",  
                "email_header": "https://picsum.photos/1200/400?random=3",
                "slide_title": "https://picsum.photos/1920/1080?random=4",
                "slide_content": "https://picsum.photos/1920/1080?random=5",
                "thumbnail": "https://picsum.photos/1280/720?random=6"
            }
            
            return {
                "status": "success",
                "image_url": mock_images.get(request.media_type, mock_images["registration_hero"]),
                "media_type": request.media_type,
                "prompt_used": f"[MOCK - OpenAI Credits Exhausted] {prompt}",
                "mock": True,
                "fallback_reason": str(oe)
            }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Image generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate image: {str(e)}")

class MarketingRequest(BaseModel):
    concept_id: str
    media_type: str  # registration_page, social_ads, email_graphics, slide_visuals

@router.post("/marketing/generate")
async def generate_marketing_copy(request: MarketingRequest):
    """
    Generate marketing copy for different assets
    Returns mock content for testing (can be enhanced with real AI generation later)
    """
    # Mock marketing copy templates
    mock_copy = {
        "registration_page": {
            "headline": "Transform Your Business in Just 60 Minutes",
            "subheadline": "Join me for a live masterclass where I'll reveal the exact framework that helped 1,000+ entrepreneurs scale to 7 figures",
            "bullet_points": [
                "The #1 mistake keeping you stuck (and how to fix it in 48 hours)",
                "My proprietary 3-step system for predictable growth",
                "Live Q&A with personalized feedback for your business"
            ],
            "cta": "Save Your Seat - Limited Spots Available"
        },
        "social_ads": {
            "primary_text": "🚀 FREE Masterclass: The Secret Framework for Scaling to 7 Figures\n\nI'm revealing everything in my live training this week.\n\nClick below to register (it's completely free) 👇",
            "headline": "Join 1,000+ Successful Entrepreneurs",
            "description": "Limited time - Register now for instant access",
            "cta": "Register Free"
        },
        "email_graphics": {
            "header_text": "You're Invited to an Exclusive Masterclass",
            "image_description": "Professional banner showing webinar topic with clean, modern design using brand colors",
            "footer_text": "Looking forward to seeing you there!"
        },
        "slide_visuals": {
            "title_slide": "Professional title with presenter name and value proposition", 
            "content_concepts": [
                "Clean, minimal slides with one key point per slide",
                "Professional color scheme matching brand",
                "High-quality graphics and icons",
                "Consistent typography and spacing"
            ]
        }
    }
    
    media_type = request.media_type
    
    return {
        "status": "success",
        "assets": mock_copy.get(media_type, mock_copy["registration_page"]),
        "media_type": media_type,
        "mock": True
    }
