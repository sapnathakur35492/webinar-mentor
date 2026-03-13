import asyncio
import io
import os
from api.services.webinar_ai import webinar_ai_service

async def test_extraction():
    pdf_path = "Manus Marits Metode - Google Docs.pdf"
    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF not found at {pdf_path}")
        return
    
    with open(pdf_path, "rb") as f:
        file_bytes = f.read()
    
    print(f"File size: {len(file_bytes)} bytes")
    extracted_text = await webinar_ai_service.extract_text_from_file(file_bytes, pdf_path)
    
    print(f"Extracted characters: {len(extracted_text)}")
    print("\n--- FIRST 2000 CHARACTERS ---\n")
    print(extracted_text[:2000])
    print("\n--- END PREVIEW ---\n")

if __name__ == "__main__":
    asyncio.run(test_extraction())
