# Marketing Copy Generation Endpoint (Simple Backend API endpoint to add)

@router.post("/marketing/generate")
async def generate_marketing_copy(request: BaseModel):
    """
    Generate marketing copy for different assets
    Returns mock content for testing (can be enhanced with real AI generation later)
    """
    from pydantic import BaseModel
    
    class MarketingRequest(BaseModel):
        concept_id: str
        media_type: str  # registration_page, social_ads, email_graphics, slide_visuals
    
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
