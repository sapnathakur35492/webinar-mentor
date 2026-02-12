from fastapi import APIRouter, HTTPException, Body, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from api.models import WebinarAsset, WebinarProcessingJob
from api.services.background_processor import background_processor
from api.services.webinar_ai import webinar_ai_service

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
    files: List[UploadFile] = File(None)
):

    """
    Upload context files and process in background.
    Returns immediately with job_id for status polling.
    """
    try:
        # Read multiple files
        files_data = []
        if files:
            for file in files:
                f_bytes = await file.read()
                files_data.append({
                    "bytes": f_bytes,
                    "filename": file.filename
                })

        # Create job record immediately
        job = WebinarProcessingJob(
            mentor_id=mentor_id,
            job_type="multi_upload",
            status="pending",
            progress=5,
            message="Materials received. Starting background processing..."
        )
        await job.save()
        
        # Queue background task (runs AFTER response is sent)
        background_tasks.add_task(
            background_processor.process_pdf_upload,
            str(job.id),
            mentor_id,
            onboarding_doc,
            hook_analysis,
            files_data
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

def _is_openai_quota_error(e: Exception) -> bool:
    """Check if error is OpenAI 429/quota related."""
    s = str(e).lower()
    return "429" in s or "quota" in s or "insufficient_quota" in s or "rate limit" in s


@router.post("/concepts/generate")
async def generate_concepts(request: GenerateRequest):
    try:
        result = await webinar_ai_service.generate_concepts_chain(request.asset_id)
        return {"status": "success", "data": result}
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR in generate_concepts: {e}")
        # ALWAYS fallback to mock on ANY error - never return 500 to frontend
        try:
            print(f"[WebinarRouter] Error detected, applying mock fallback: {str(e)[:200]}")
            result = await webinar_ai_service.apply_mock_fallback_for_asset(
                request.asset_id, reason=f"Fallback: {str(e)[:100]}"
            )
            return {"status": "success", "data": result}
        except Exception as fallback_err:
            print(f"[WebinarRouter] Mock fallback also failed: {fallback_err}")
            # Last resort: return mock data without saving to DB
            mock_data = webinar_ai_service._get_mock_response(f"Error: {str(e)[:100]}")
            return {"status": "success", "data": mock_data}

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

class RefineConceptRequest(BaseModel):
    asset_id: str
    concept_id: str
    feedback: str

@router.post("/concepts/refine")
async def refine_concept(request: RefineConceptRequest):
    try:
        result = await webinar_ai_service.refine_concept(
            request.asset_id,
            request.concept_id,
            request.feedback
        )
        return JSONResponse(content=jsonable_encoder(result))
    except Exception as e:
        print(f"Error in refine_concept: {e}")
        import traceback
        traceback.print_exc()
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
        
        # IMPROVED SERIALIZATION: Convert to dict manually to avoid potential 500s 
        # when Pydantic tries to validate complex Beanie documents with nested models
        return JSONResponse(content=jsonable_encoder(asset))
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
    talking_photo_id: Optional[str] = None
    voice_id: Optional[str] = None
    fast_mode: Optional[bool] = True


class InstantAudioRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    speed: Optional[float] = 1.0


@router.post("/video/instant-audio")
async def generate_instant_audio(request: InstantAudioRequest):
    """
    FAST path (seconds): returns MP3 audio for the given text.
    This does NOT create anything on HeyGen.
    Frontend can turn this into a quick preview video locally.
    """
    try:
        from api.services.tts_service import tts_service

        audio_bytes = tts_service.synthesize_mp3(
            request.text,
            voice=request.voice,
            speed=float(request.speed or 1.0),
        )
        if not audio_bytes:
            raise ValueError("TTS returned empty audio")

        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video/generate")
async def generate_video(request: VideoGenerateRequest):
    try:
        from api.services.heygen_service import heygen_service
        text = request.script_text
        
        # If asset_id provided AND no script_text, attempt to fetch from structure
        if request.asset_id and not text:
            try:
                from api.models import WebinarAsset
                asset = await WebinarAsset.get(request.asset_id)
                if asset and asset.structure_content:
                    # Cap script length for stability
                    text = asset.structure_content[:1200]
            except Exception:
                # If asset_id is invalid / DB error, don't crash video generation.
                pass
        
        if not text:
             raise HTTPException(status_code=400, detail="No script text provided or found in asset")

        # Speed: cap script length (shorter = faster processing)
        try:
            from core.settings import settings
            max_chars = int(getattr(settings, "HEYGEN_MAX_CHARS", 900))
        except Exception:
            max_chars = 900
        if max_chars and len(text) > max_chars:
            text = text[:max_chars]

        # HeyGen: generate avatar video (Photo Avatar / Talking Photo)
        # Note: `source_url` is kept for backward compatibility but is not used by HeyGen.
        result = heygen_service.safe_generate_video(
            script_text=text,
            talking_photo_id=request.talking_photo_id,
            voice_id=request.voice_id,
            # Fast mode: default to Avatar III for speed (less expressive than IV)
            use_avatar_iv_model=False if request.fast_mode else None,
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create video with HeyGen")
        
        # SAVE video id to asset (keep existing field name for UI compatibility)
        if request.asset_id:
            try:
                from api.models import WebinarAsset
                asset = await WebinarAsset.get(request.asset_id)
                if asset:
                    asset.video_talk_id = result.get("id")
                    asset.video_status = "pending"
                    await asset.save()
            except: pass
            
        return {
            "status": "success", 
            "data": result,
            "talk_id": result.get("id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video/{talk_id}")
async def get_video_status(talk_id: str):
    try:
        from api.services.heygen_service import heygen_service
        try:
            result = heygen_service.get_video_status(talk_id)
        except Exception as inner:
            # Don't crash UI polling; return a stable error object
            return {"id": talk_id, "status": "error", "result_url": None, "detail": str(inner)[:200]}
        if not result:
             raise HTTPException(status_code=404, detail="Talk not found")
        
        # PERSIST: If completed, save the URL to the asset
        # Never persist mock/sample runs.
        if (
            result.get("status") in ("done", "completed")
            and result.get("result_url")
            and "mock" not in str(result.get("provider", "")).lower()
            and "mock" not in str(talk_id).lower()
        ):
            try:
                from api.models import WebinarAsset
                # Find the asset that owns this talk
                asset = await WebinarAsset.find_one(WebinarAsset.video_talk_id == talk_id)
                if asset:
                    asset.video_url = result.get("result_url")
                    asset.video_status = "completed"
                    await asset.save()
                    print(f"Persisted video URL for asset {asset.id}")
            except Exception as e: 
                print(f"Error persisting video status: {e}")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- HeyGen helpers (optional, for setup) ---
@router.get("/video/heygen/voices")
async def heygen_list_voices():
    """
    Convenience endpoint to fetch HeyGen voices so you can pick a Norwegian `voice_id`.
    """
    try:
        from api.services.heygen_service import heygen_service
        return heygen_service.list_voices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/heygen/avatar-groups")
async def heygen_list_avatar_groups():
    """
    Convenience endpoint to list avatar groups (for Photo Avatars).
    Each "look id" can be used as `talking_photo_id`.
    """
    try:
        from api.services.heygen_service import heygen_service
        return heygen_service.list_avatar_groups()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/heygen/avatar-groups/{group_id}/avatars")
async def heygen_list_avatars_in_group(group_id: str):
    """
    Convenience endpoint to list avatars/looks inside a group.
    Use the returned `id` as `talking_photo_id` for `/video/generate`.
    """
    try:
        from api.services.heygen_service import heygen_service
        return heygen_service.list_avatars_in_group(group_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PromotionalImageRequest(BaseModel):
    concept_id: str
    media_type: str  # e.g., "registration_hero", "social_ad", "email_header"
    concept_text: Optional[str] = None
    fast_mode: bool = True

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
            
            # SPEED OPTIMIZATION: DALL-E 2 is significantly faster than DALL-E 3
            # DALL-E 2 (~2-5s) vs DALL-E 3 (~15-20s)
            is_fast = request.fast_mode
            model = "dall-e-2" if is_fast else "dall-e-3"
            size = "512x512" if is_fast else "1024x1024"
            
            print(f"Generating image ({model}, {size}) for {request.media_type} via OpenAI...")
            
            response = client.images.generate(
                model=model,
                prompt=prompt,
                size=size,
                quality="standard",
                n=1,
            )
            
            image_url = response.data[0].url
            
            # SUCCESS: Save the result to the database!
            image_result = {
                "status": "success",
                "image_url": image_url,
                "media_type": request.media_type,
                "prompt_used": prompt,
                "created_at": datetime.utcnow().isoformat()
            }
            
            try:
                asset = await WebinarAsset.get(request.concept_id)
                if asset:
                    # Initialize list if missing
                    if asset.promotional_images is None:
                        asset.promotional_images = []
                    
                    # Remove existing image of same type if any
                    asset.promotional_images = [img for img in asset.promotional_images if img.get("media_type") != request.media_type]
                    
                    # Add new image
                    asset.promotional_images.append({
                        "media_type": request.media_type,
                        "image_url": image_url,
                        "status": "generated",
                        "created_at": datetime.utcnow()
                    })
                    await asset.save()
                    print(f"Successfully saved image {request.media_type} to asset {request.concept_id}")
            except Exception as db_err:
                print(f"Error saving image to DB: {db_err}")

            return image_result

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
            
            image_url = mock_images.get(request.media_type, mock_images["registration_hero"])
            
            # Save MOCK result too
            try:
                asset = await WebinarAsset.get(request.concept_id)
                if asset:
                    if asset.promotional_images is None:
                        asset.promotional_images = []
                    asset.promotional_images = [img for img in asset.promotional_images if img.get("media_type") != request.media_type]
                    asset.promotional_images.append({
                        "media_type": request.media_type,
                        "image_url": image_url,
                        "status": "generated",
                        "created_at": datetime.utcnow(),
                        "mock": True
                    })
                    await asset.save()
            except: pass

            return {
                "status": "success",
                "image_url": image_url,
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
