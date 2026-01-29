from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from api.models import ApprovalHistory, WebinarAsset, Mentor
from beanie import PydanticObjectId

router = APIRouter()


class SubmitForApprovalRequest(BaseModel):
    asset_id: str
    content_type: str  # "concept", "structure", "email_sequence"


class AdminReviewRequest(BaseModel):
    approval_id: str
    action: str  # "approve", "reject", "request_revision"
    admin_notes: Optional[str] = None
    revision_instructions: Optional[str] = None


class ApprovalStatusResponse(BaseModel):
    can_proceed: bool
    current_status: str
    admin_notes: Optional[str] = None
    message: str


@router.post("/submit")
async def submit_for_approval(request: SubmitForApprovalRequest):
    """
    Submit content for admin approval.
    Creates an approval history record and updates asset status.
    """
    try:
        # Find the asset
        asset = await WebinarAsset.get(PydanticObjectId(request.asset_id))
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Get current version based on content type
        if request.content_type == "concept":
            version = asset.concept_version
            content_snapshot = {
                "concepts_improved": [c.dict() for c in asset.concepts_improved] if asset.concepts_improved else [],
                "selected_concept": asset.selected_concept.dict() if asset.selected_concept else None
            }
            asset.concept_approval_status = "pending"
        elif request.content_type == "structure":
            version = asset.structure_version
            content_snapshot = {
                "structure": [s.dict() for s in asset.structure] if asset.structure else [],
                "structure_content": asset.structure_content
            }
            asset.structure_approval_status = "pending"
        elif request.content_type == "email_sequence":
            version = asset.email_version
            content_snapshot = {
                "email_plan": asset.email_plan.dict() if asset.email_plan else None
            }
            asset.email_approval_status = "pending"
        else:
            raise HTTPException(status_code=400, detail="Invalid content type")
        
        # Get previous version ID if exists
        previous = await ApprovalHistory.find_one(
            ApprovalHistory.asset_id == request.asset_id,
            ApprovalHistory.content_type == request.content_type,
            sort=[("version", -1)]
        )
        
        # Create approval history record
        approval = ApprovalHistory(
            mentor_id=asset.mentor_id,
            asset_id=request.asset_id,
            content_type=request.content_type,
            version=version,
            content_snapshot=content_snapshot,
            status="pending",
            submitted_at=datetime.utcnow(),
            iteration_count=previous.iteration_count + 1 if previous else 1,
            previous_version_id=str(previous.id) if previous else None
        )
        await approval.insert()
        
        # Update asset
        asset.updated_at = datetime.utcnow()
        await asset.save()
        
        return {
            "status": "success",
            "message": f"{request.content_type.title()} submitted for approval",
            "approval_id": str(approval.id),
            "version": version
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/review")
async def admin_review(request: AdminReviewRequest):
    """
    Admin reviews and takes action on submitted content.
    """
    try:
        # Find the approval record
        approval = await ApprovalHistory.get(PydanticObjectId(request.approval_id))
        if not approval:
            raise HTTPException(status_code=404, detail="Approval record not found")
        
        # Find the asset
        asset = await WebinarAsset.get(PydanticObjectId(approval.asset_id))
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Update approval record
        approval.status = request.action
        approval.reviewed_at = datetime.utcnow()
        approval.admin_notes = request.admin_notes
        approval.revision_instructions = request.revision_instructions
        await approval.save()
        
        # Update asset status based on content type
        if approval.content_type == "concept":
            if request.action == "approve":
                asset.concept_approval_status = "approved"
            elif request.action == "reject":
                asset.concept_approval_status = "revision_requested"
                asset.concept_version += 1
            asset.concept_admin_notes = request.admin_notes
        elif approval.content_type == "structure":
            if request.action == "approve":
                asset.structure_approval_status = "approved"
            elif request.action == "reject":
                asset.structure_approval_status = "revision_requested"
                asset.structure_version += 1
            asset.structure_admin_notes = request.admin_notes
        elif approval.content_type == "email_sequence":
            if request.action == "approve":
                asset.email_approval_status = "approved"
            elif request.action == "reject":
                asset.email_approval_status = "revision_requested"
                asset.email_version += 1
            asset.email_admin_notes = request.admin_notes
        
        asset.updated_at = datetime.utcnow()
        await asset.save()
        
        # Update mentor stage if all approved
        if request.action == "approve":
            mentor = await Mentor.find_one(Mentor.user_id == asset.mentor_id)
            if mentor:
                if approval.content_type == "concept" and asset.concept_approval_status == "approved":
                    mentor.current_stage = "structure_development"
                elif approval.content_type == "structure" and asset.structure_approval_status == "approved":
                    mentor.current_stage = "email_sequence"
                elif approval.content_type == "email_sequence" and asset.email_approval_status == "approved":
                    mentor.current_stage = "production"
                mentor.stage_started_at = datetime.utcnow()
                await mentor.save()
        
        return {
            "status": "success",
            "message": f"Content {request.action}d successfully",
            "new_status": approval.status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{asset_id}/{content_type}")
async def check_approval_status(asset_id: str, content_type: str):
    """
    Check if content is approved and can proceed to next phase.
    """
    try:
        asset = await WebinarAsset.get(PydanticObjectId(asset_id))
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        if content_type == "concept":
            status = asset.concept_approval_status
            notes = asset.concept_admin_notes
        elif content_type == "structure":
            status = asset.structure_approval_status
            notes = asset.structure_admin_notes
        elif content_type == "email_sequence":
            status = asset.email_approval_status
            notes = asset.email_admin_notes
        else:
            raise HTTPException(status_code=400, detail="Invalid content type")
        
        can_proceed = status == "approved"
        
        messages = {
            "draft": "Content is in draft. Submit for approval to proceed.",
            "pending": "Content is pending admin review.",
            "approved": "Content approved! You can proceed to the next phase.",
            "revision_requested": "Admin requested revisions. Please update and resubmit."
        }
        
        return ApprovalStatusResponse(
            can_proceed=can_proceed,
            current_status=status,
            admin_notes=notes,
            message=messages.get(status, "Unknown status")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{asset_id}")
async def get_approval_history(asset_id: str, content_type: Optional[str] = None):
    """
    Get all approval history for an asset, optionally filtered by content type.
    """
    try:
        query = {"asset_id": asset_id}
        if content_type:
            query["content_type"] = content_type
        
        history = await ApprovalHistory.find(query).sort("-version").to_list()
        
        return {
            "status": "success",
            "history": [
                {
                    "id": str(h.id),
                    "content_type": h.content_type,
                    "version": h.version,
                    "status": h.status,
                    "submitted_at": h.submitted_at.isoformat() if h.submitted_at else None,
                    "reviewed_at": h.reviewed_at.isoformat() if h.reviewed_at else None,
                    "admin_notes": h.admin_notes,
                    "iteration_count": h.iteration_count
                }
                for h in history
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/can-proceed/{mentor_id}/{target_stage}")
async def can_proceed_to_stage(mentor_id: str, target_stage: str):
    """
    Check if mentor can proceed to a specific stage based on approval status.
    This is used for gating navigation in the frontend.
    """
    try:
        # Find latest asset for mentor
        asset = await WebinarAsset.find_one(
            WebinarAsset.mentor_id == mentor_id,
            sort=[("created_at", -1)]
        )
        
        if not asset:
            return {
                "can_proceed": target_stage == "onboarding",
                "reason": "No asset found - start with onboarding"
            }
        
        # Define stage requirements
        stage_requirements = {
            "onboarding": {"required_approvals": []},
            "concept_generation": {"required_approvals": []},
            "concept_review": {"required_approvals": []},
            "structure_development": {"required_approvals": ["concept"]},
            "structure_review": {"required_approvals": ["concept"]},
            "email_sequence": {"required_approvals": ["concept", "structure"]},
            "production": {"required_approvals": ["concept", "structure", "email_sequence"]}
        }
        
        requirements = stage_requirements.get(target_stage, {"required_approvals": []})
        missing_approvals = []
        
        for req in requirements["required_approvals"]:
            if req == "concept" and asset.concept_approval_status != "approved":
                missing_approvals.append("Webinar Concept")
            elif req == "structure" and asset.structure_approval_status != "approved":
                missing_approvals.append("Slide Structure")
            elif req == "email_sequence" and asset.email_approval_status != "approved":
                missing_approvals.append("Email Sequences")
        
        can_proceed = len(missing_approvals) == 0
        
        return {
            "can_proceed": can_proceed,
            "missing_approvals": missing_approvals,
            "reason": f"Waiting for approval: {', '.join(missing_approvals)}" if missing_approvals else "All requirements met"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
