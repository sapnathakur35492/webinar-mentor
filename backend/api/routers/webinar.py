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
    """Mentor selects a concept: save to S3 + Webinar_Concept with Status=Pending(0). Admin will approve later."""
    try:
        from api.models import WebinarAsset, WebinarConcept, ConceptStatus
        import json as _json
        
        asset = await WebinarAsset.get(asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        source_list = asset.concepts_improved if request.from_improved else asset.concepts_original
        
        if not source_list or request.concept_index >= len(source_list):
            raise HTTPException(status_code=400, detail="Invalid concept index")
            
        # 1. Set selected concept on the asset (status = pending, waiting for admin)
        selected = source_list[request.concept_index]
        asset.selected_concept = selected
        asset.concept_approval_status = "pending"
        await asset.save()
        print(f"[SelectConcept] Concept {request.concept_index + 1} selected for asset {asset_id}")
        
        # 2. Upload concept JSON to S3
        s3_url = ""
        concept_dict = selected.dict() if hasattr(selected, 'dict') else dict(selected)
        concept_json = _json.dumps(concept_dict, indent=2, ensure_ascii=False)
        file_name = f"concept_{asset.mentor_id}_{request.concept_index + 1}.json"
        
        try:
            from core.s3 import s3_service
            s3_url = await s3_service.upload_file(
                file_content=concept_json.encode("utf-8"),
                file_name=file_name,
                content_type="application/json"
            )
            print(f"[SelectConcept] Concept uploaded to S3: {s3_url}")
        except Exception as s3_err:
            print(f"[SelectConcept] WARNING: S3 upload failed: {s3_err}")
        
        # 3. Save to Webinar_Concept collection with Status=Pending(0)
        try:
            wc = WebinarConcept(
                MentorId=asset.mentor_id,
                ConceptNumber=request.concept_index + 1,
                ConceptTitle=concept_dict.get("title", ""),
                ConceptData=concept_dict,
                Status=ConceptStatus.Pending,  # 0 = Pending (default)
                FileName=file_name,
                FileType="application/json",
                S3Url=s3_url,
            )
            await wc.insert()
            print(f"[SelectConcept] Webinar_Concept record created: {wc.id}, Status=Pending(0)")
        except Exception as db_err:
            print(f"[SelectConcept] WARNING: DB save failed: {db_err}")
        
        return {
            "status": "success", 
            "selected_concept": asset.selected_concept,
            "s3_url": s3_url,
            "concept_status": ConceptStatus.Pending,  # 0 = Pending
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Admin Approval Endpoint ---
class AdminApproveRequest(BaseModel):
    action: str = "approve"  # "approve" or "reject"
    admin_notes: Optional[str] = None

@router.post("/assets/concepts/{concept_id}/admin-approve")
async def admin_approve_concept(concept_id: str, request: AdminApproveRequest):
    """
    Admin approves or rejects a concept.
    Status: Pending(0) -> Approved(1) or Rejected(2)
    """
    try:
        from api.models import WebinarConcept, ConceptStatus, WebinarAsset
        from bson import ObjectId
        
        wc = await WebinarConcept.get(concept_id)
        if not wc:
            raise HTTPException(status_code=404, detail="Concept not found")
        
        if request.action == "approve":
            wc.Status = ConceptStatus.Approved  # 1
            new_status = "approved"
            print(f"[AdminApprove] Concept {concept_id} APPROVED by admin")
        elif request.action == "reject":
            wc.Status = ConceptStatus.Rejected  # 2
            new_status = "rejected"
            print(f"[AdminApprove] Concept {concept_id} REJECTED by admin")
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
        
        await wc.save()
        
        # Also update the WebinarAsset's concept_approval_status
        try:
            assets = await WebinarAsset.find(
                WebinarAsset.mentor_id == wc.MentorId
            ).to_list()
            for asset in assets:
                asset.concept_approval_status = new_status
                await asset.save()
                print(f"[AdminApprove] Updated asset {asset.id} concept_approval_status={new_status}")
        except Exception as asset_err:
            print(f"[AdminApprove] WARNING: Asset update failed: {asset_err}")
        
        return {
            "status": "success",
            "concept_id": str(wc.id),
            "concept_title": wc.ConceptTitle,
            "concept_status": wc.Status,  # 0=Pending, 1=Approved, 2=Rejected
            "s3_url": wc.S3Url,
            "action": request.action,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Admin Approval for Videos ---
@router.post("/assets/videos/{video_id}/admin-approve")
async def admin_approve_video(video_id: str, request: AdminApproveRequest):
    """
    Admin approves or rejects a video.
    Status: Pending(0) -> Approved(1) or Rejected(2)
    """
    try:
        from api.models import WebinarVideo, ConceptStatus

        wv = await WebinarVideo.get(video_id)
        if not wv:
            raise HTTPException(status_code=404, detail="Video not found")

        if request.action == "approve":
            wv.Status = ConceptStatus.Approved  # 1
            new_status = "approved"
            print(f"[AdminApprove] Video {video_id} APPROVED by admin")
        elif request.action == "reject":
            wv.Status = ConceptStatus.Rejected  # 2
            new_status = "rejected"
            print(f"[AdminApprove] Video {video_id} REJECTED by admin")
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")

        await wv.save()

        return {
            "status": "success",
            "video_id": str(wv.id),
            "talk_id": wv.TalkId,
            "video_status": wv.Status,  # 0=Pending, 1=Approved, 2=Rejected
            "video_s3_url": wv.VideoS3Url,
            "script_s3_url": wv.ScriptS3Url,
            "action": request.action,
        }
    except HTTPException:
        raise
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
    image_path: Optional[str] = None
    aspect_ratio: Optional[str] = "16:9"
    duration_seconds: Optional[int] = 8
    language_tone: Optional[str] = "Norwegian"
    gender: Optional[str] = "female" # male or female


class InstantAudioRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    speed: Optional[float] = 1.0


@router.post("/video/instant-audio")
async def generate_instant_audio(request: InstantAudioRequest):
    """
    FAST path (seconds): returns MP3 audio for the given text.
    Frontend can turn this into a quick preview audio locally.
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

@router.post("/video/upload-avatar")
async def upload_avatar_image(file: UploadFile = File(...)):
    """
    Upload an avatar image. Saves locally AND to S3.
    Returns file_path (local) and s3_url (cloud).
    """
    try:
        from api.services.gemini_video_service import gemini_video_service
        file_bytes = await file.read()
        
        # 1. Save locally (for Gemini video generation)
        result = gemini_video_service.save_avatar_image(file_bytes, file.filename)
        
        # 2. Upload to S3 (for fast access & persistence on live server)
        s3_url = ""
        try:
            from core.s3 import s3_service
            s3_url = await s3_service.upload_file(
                file_content=file_bytes,
                file_name=f"avatars/{result['filename']}",
                content_type=file.content_type or "image/jpeg"
            )
            print(f"[Avatar] Uploaded to S3: {s3_url}")
        except Exception as s3_err:
            print(f"[Avatar] WARNING: S3 upload failed (local save OK): {s3_err}")
        
        return {"status": "success", "s3_url": s3_url, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/video/generate")
async def generate_video(request: VideoGenerateRequest):
    try:
        from api.services.gemini_video_service import gemini_video_service
        from api.services.heygen_service import heygen_service
        from core.settings import settings
        
        text = request.script_text
        provider = settings.DEFAULT_VIDEO_PROVIDER.lower()
        
        # If asset_id provided AND no script_text, attempt to fetch from structure
        if request.asset_id and not text:
            try:
                from api.models import WebinarAsset
                asset = await WebinarAsset.get(request.asset_id)
                if asset and asset.structure_content:
                    text = asset.structure_content[:1200]
            except Exception:
                pass
        
        if not text:
             raise HTTPException(status_code=400, detail="No script text provided or found in asset")

        # Cap script length for stability
        # UPDATE: Increased to 5000 to allow full story reading per user request
        max_chars = 5000
        if len(text) > max_chars:
            text = text[:max_chars]

        # Determine language tone
        language = request.language_tone or "Norwegian"
        
        # If not explicitly provided, try to fetch from Mentor profile via Asset
        if request.asset_id and not request.language_tone:
             try:
                 from api.models import WebinarAsset, Mentor
                 asset = await WebinarAsset.get(request.asset_id)
                 if asset and asset.mentor_id:
                     mentor = await Mentor.find_one(Mentor.user_id == asset.mentor_id)
                     if mentor and hasattr(mentor, "language_tone") and mentor.language_tone:
                         language = mentor.language_tone
             except Exception as e:
                 print(f"Warning: Could not fetch mentor language: {e}")

        # Provider-based generation
        if provider == "heygen":
            print(f"[WebinarRouter] Generating via HeyGen...")
            
            # Resolve image_path from URL to file system if needed
            resolved_image_path = None
            if request.image_path:
                print(f"[WebinarRouter] Resolving image_path: {request.image_path}")
                try:
                    # Case 1: Already an absolute path
                    if os.path.exists(request.image_path):
                        resolved_image_path = request.image_path
                        print(f"[WebinarRouter] Found as absolute path: {resolved_image_path}")
                    # Case 2: URL like /static/avatars/...
                    elif "/static/" in request.image_path:
                        # Attempt to resolve relative to backend root
                        import os
                        
                        # Handle full URLs (http://...) by splitting at /static/
                        # This handles both "/static/foo.jpg" and "http://localhost:8000/static/foo.jpg"
                        try:
                            clean_part = request.image_path.split("/static/")[-1] 
                        except:
                            clean_part = request.image_path
                            
                        # 1. Try resolving relative to CWD (backend root)
                        possible_path = os.path.abspath(os.path.join("static", clean_part))
                        print(f"[WebinarRouter] Checking relative path 1: {possible_path}")
                        if os.path.exists(possible_path):
                            resolved_image_path = possible_path
                        else:
                            # Try relative to this file location (backend/api/routers) -> backend/static
                            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                            possible_path_2 = os.path.join(base_dir, "static", clean_part)
                            print(f"[WebinarRouter] Checking relative path 2: {possible_path_2}")
                            if os.path.exists(possible_path_2):
                                resolved_image_path = possible_path_2
                            # Fallback: Check if file is just in static root
                            else:
                                filename = os.path.basename(clean_part)
                                possible_path_3 = os.path.join(base_dir, "static", filename)
                                print(f"[WebinarRouter] Checking relative path 3: {possible_path_3}")
                                if os.path.exists(possible_path_3):
                                    resolved_image_path = possible_path_3
                                    
                except Exception as e:
                    print(f"Error resolving image path: {e}")
            else:
                print("[WebinarRouter] No image_path provided in request")
            
            if not resolved_image_path:
                 print("[WebinarRouter] WARNING: Could not verify existence of avatar image on disk.")
                 # FINAL FALLBACK: Use DORA-14.jpg if it exists, so generation doesn't fail
                 try:
                     base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                     dora_path = os.path.join(base_dir, "static", "DORA-14.jpg")
                     if os.path.exists(dora_path):
                         print(f"[WebinarRouter] Using fallback DORA-14.jpg: {dora_path}")
                         resolved_image_path = dora_path
                 except: pass

            result = heygen_service.safe_generate_video(
                script_text=text,
                image_path=resolved_image_path,
                talking_photo_id=None, # will use default DORA-14 if no image_path
                avatar_id=None,
                voice_id=None,
                use_avatar_iv_model=True,
                gender=request.gender # Pass gender from request
            )
            
            # Check if service caught an exception and returned an error result
            if result.get("status") == "error":
                error_msg = result.get("error") or result.get("detail") or "Unknown heygen error"
                print(f"[WebinarRouter] HeyGen service returned error: {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)
                
        else:
            print(f"[WebinarRouter] Generating via Gemini Veo...")
            result = gemini_video_service.safe_generate_video(
                script_text=text,
                image_path=request.image_path,
                aspect_ratio=request.aspect_ratio or "16:9",
                duration_seconds=request.duration_seconds or 8,
                language_tone=language
            )
        
        if not result:
            raise HTTPException(status_code=500, detail=f"Failed to start video generation with {provider}")
        
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error", "Video generation failed"))
        
        # SAVE operation id to asset (reuse video_talk_id field for UI compat)
        if request.asset_id:
            try:
                from api.models import WebinarAsset
                asset = await WebinarAsset.get(request.asset_id)
                if asset:
                    asset.video_talk_id = result.get("id")
                    asset.video_status = "pending"
                    await asset.save()
            except: pass
            
        # --- Save script to S3 and create Webinar_Video record ---
        try:
            from core.s3 import s3_service
            from api.models import WebinarVideo, ConceptStatus
            
            mentor_id = ""
            if request.asset_id:
                try:
                    asset_for_mentor = await WebinarAsset.get(request.asset_id)
                    if asset_for_mentor:
                        mentor_id = asset_for_mentor.mentor_id
                except: pass
            
            talk_id = result.get("id", "")
            script_file_name = f"video_script_{talk_id}.txt"
            script_s3_url = await s3_service.upload_file(
                file_content=text.encode("utf-8"),
                file_name=script_file_name,
                content_type="text/plain"
            )
            
            wv = WebinarVideo(
                MentorId=mentor_id,
                TalkId=talk_id,
                Script=text,
                ScriptS3Url=script_s3_url,
                VideoS3Url="",
                VideoSourceUrl="",
                Status=ConceptStatus.Pending,  # 0 = Pending
            )
            await wv.insert()
            print(f"[WebinarRouter] Script saved to S3: {script_s3_url}, Webinar_Video record: {wv.id}, Status=Pending(0)")
        except Exception as s3_err:
            print(f"[WebinarRouter] WARNING: S3/DB save for video script failed: {s3_err}")

        return {
            "status": "success", 
            "data": result,
            "talk_id": result.get("id")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/{talk_id:path}")
async def get_video_status(talk_id: str):
    try:
        from api.services.gemini_video_service import gemini_video_service
        from api.services.heygen_service import heygen_service
        
        # Detect provider
        if "/" in talk_id or "operation" in talk_id.lower():
            service = gemini_video_service
            provider_name = "Gemini"
        else:
            service = heygen_service
            provider_name = "HeyGen"
            
        try:
            result = service.get_video_status(talk_id)
        except Exception as inner:
            return {"id": talk_id, "status": "error", "result_url": None, "detail": str(inner)[:200]}
            
        if not result:
             raise HTTPException(status_code=404, detail=f"Video operation not found ({provider_name})")
        
        # PERSIST: If completed, save the URL to the asset AND S3 + Webinar_Video
        if (
            result.get("status") in ("done", "completed")
            and result.get("result_url")
        ):
            video_source_url = result.get("result_url")
            
            # Save to WebinarAsset (existing logic)
            try:
                from api.models import WebinarAsset
                asset = await WebinarAsset.find_one(WebinarAsset.video_talk_id == talk_id)
                if asset:
                    asset.video_url = video_source_url
                    asset.video_status = "completed"
                    await asset.save()
                    print(f"Persisted video URL for asset {asset.id}")
            except Exception as e: 
                print(f"Error persisting video status: {e}")
            
            # --- Upload video to S3 and update Webinar_Video record ---
            try:
                from core.s3 import s3_service
                from api.models import WebinarVideo, ConceptStatus
                import requests as req
                
                # Download the video from HeyGen/Gemini URL
                video_resp = req.get(video_source_url, timeout=120)
                if video_resp.status_code == 200:
                    video_file_name = f"webinar_video_{talk_id}.mp4"
                    video_s3_url = await s3_service.upload_file(
                        file_content=video_resp.content,
                        file_name=video_file_name,
                        content_type="video/mp4"
                    )
                    
                    # Update existing Webinar_Video record
                    wv = await WebinarVideo.find_one(WebinarVideo.TalkId == talk_id)
                    if wv:
                        wv.VideoS3Url = video_s3_url
                        wv.VideoSourceUrl = video_source_url
                        wv.Status = ConceptStatus.Pending  # stays 0=Pending until admin approves
                        await wv.save()
                        print(f"[WebinarRouter] Video saved to S3: {video_s3_url}, Webinar_Video updated: {wv.id}, Status=Pending(0)")
                    else:
                        # Fallback: create a new record if not found
                        wv_new = WebinarVideo(
                            MentorId="",
                            TalkId=talk_id,
                            Script="",
                            ScriptS3Url="",
                            VideoS3Url=video_s3_url,
                            VideoSourceUrl=video_source_url,
                            Status=ConceptStatus.Pending,  # 0 = Pending
                        )
                        await wv_new.insert()
                        print(f"[WebinarRouter] Video saved to S3 (new record): {video_s3_url}, Status=Pending(0)")
                else:
                    print(f"[WebinarRouter] WARNING: Failed to download video from {video_source_url}: HTTP {video_resp.status_code}")
            except Exception as s3_err:
                print(f"[WebinarRouter] WARNING: S3 video upload failed: {s3_err}")

        return result
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
