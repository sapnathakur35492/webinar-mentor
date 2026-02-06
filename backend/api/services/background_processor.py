"""
Background Processor Service for Async PDF/AI Processing

This service handles long-running tasks in the background using FastAPI's BackgroundTasks.
It updates the job status in MongoDB so the frontend can poll for progress.
"""

import asyncio
from datetime import datetime
from api.models import WebinarAsset, WebinarProcessingJob
from api.services.webinar_ai import webinar_ai_service
from typing import Optional


class BackgroundProcessor:
    """Handles background processing of PDF uploads and AI generation tasks"""
    
    async def process_pdf_upload(
        self, 
        job_id: str, 
        mentor_id: str, 
        onboarding_doc: str, 
        hook_analysis: str,
        files_data: Optional[list] = None
    ):
        """
        Background task for multi-file processing.
        This runs after the HTTP response is sent.
        """
        try:
            # Get the job record
            job = await WebinarProcessingJob.get(job_id)
            if not job:
                print(f"[BackgroundProcessor] Job {job_id} not found!")
                return
            
            # Update status to processing
            job.status = "processing"
            job.progress = 10
            job.message = "Analyzing uploaded materials..."
            job.updated_at = datetime.utcnow()
            await job.save()
            
            # Step 1: Extract text from multiple files
            all_extracted_text = []
            if files_data:
                for idx, file_info in enumerate(files_data):
                    f_bytes = file_info.get("bytes")
                    f_name = file_info.get("filename")
                    
                    if f_bytes and f_name:
                        job.progress = 10 + int((idx / len(files_data)) * 30)
                        job.message = f"Extracting text from {f_name}..."
                        await job.save()
                        
                        extracted = await webinar_ai_service.extract_text_from_file(f_bytes, f_name)
                        if extracted:
                            all_extracted_text.append(f"--- [EXTRACTED FROM {f_name}] ---\n{extracted}")
                
                if all_extracted_text:
                    onboarding_doc = f"{onboarding_doc}\n\n" + "\n\n".join(all_extracted_text)
            
            job.progress = 40
            job.message = "Materials synced. Saving to database..."
            await job.save()

            
            # Step 2: Create WebinarAsset
            asset = WebinarAsset(
                mentor_id=mentor_id,
                onboarding_doc_content=onboarding_doc,
                hook_analysis_content=hook_analysis
            )
            await asset.save()
            
            job.progress = 50
            job.message = "Document saved. Starting AI concept generation..."
            job.result_asset_id = str(asset.id)
            await job.save()
            
            # Step 3: Generate concepts using AI (this is the slow part)
            try:
                job.progress = 60
                job.message = "AI is generating webinar concepts (this may take 1-2 minutes)..."
                await job.save()
                
                result = await webinar_ai_service.generate_concepts_chain(str(asset.id))
                
                job.progress = 90
                job.message = "Finalizing concepts..."
                await job.save()
                
            except Exception as ai_error:
                # AI generation failed, but asset was created
                print(f"[BackgroundProcessor] AI generation error: {ai_error}")
                job.progress = 100
                job.status = "completed"
                job.message = f"Document saved. AI generation had an issue: {str(ai_error)[:100]}"
                job.updated_at = datetime.utcnow()
                await job.save()
                return
            
            # Step 4: Mark complete
            job.status = "completed"
            job.progress = 100
            job.message = "Processing complete! Concepts are ready."
            job.updated_at = datetime.utcnow()
            await job.save()
            
            print(f"[BackgroundProcessor] Job {job_id} completed successfully. Asset ID: {asset.id}")
            
        except Exception as e:
            print(f"[BackgroundProcessor] Job {job_id} failed: {e}")
            import traceback
            traceback.print_exc()
            
            # Update job with error
            try:
                job = await WebinarProcessingJob.get(job_id)
                if job:
                    job.status = "failed"
                    job.error = str(e)[:500]
                    job.message = f"Processing failed: {str(e)[:100]}"
                    job.updated_at = datetime.utcnow()
                    await job.save()
            except Exception as save_error:
                print(f"[BackgroundProcessor] Failed to save error status: {save_error}")
    
    async def process_concept_generation(self, job_id: str, asset_id: str):
        """Background task for concept generation only (when PDF already uploaded)"""
        try:
            job = await WebinarProcessingJob.get(job_id)
            if not job:
                return
            
            job.status = "processing"
            job.progress = 20
            job.message = "Starting AI concept generation..."
            await job.save()
            
            result = await webinar_ai_service.generate_concepts_chain(asset_id)
            
            job.status = "completed"
            job.progress = 100
            job.message = "Concepts generated successfully!"
            job.result_asset_id = asset_id
            await job.save()
            
        except Exception as e:
            job = await WebinarProcessingJob.get(job_id)
            if job:
                job.status = "failed"
                job.error = str(e)[:500]
                job.message = f"Concept generation failed: {str(e)[:100]}"
                await job.save()


# Singleton instance
background_processor = BackgroundProcessor()
