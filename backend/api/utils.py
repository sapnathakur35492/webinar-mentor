from fastapi import UploadFile
import io

async def extract_text_from_file(file: UploadFile) -> str:
    if not file:
        return ""
    
    content = await file.read()
    filename = file.filename.lower()
    
    if filename.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Error reading PDF {file.filename}: {e}")
            return ""
    else:
        # Assume text/md
        try:
            return content.decode("utf-8")
        except:
            return ""

