import io
import logging
from typing import Optional, Tuple
from core.settings import settings

logger = logging.getLogger(__name__)

class FileStorageService:
    def __init__(self):
        # Lazy initialization
        self._fs = None
        self._client = None
        self._db = None

    @property
    def fs(self):
        if self._fs:
            return self._fs
            
        # Lazy import
        from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
        
        # Try to use shared client from database_mongo
        try:
            from database_mongo import client
            if client:
                self._client = client
                self._db = self._client.get_database("change20_db")
                self._fs = AsyncIOMotorGridFSBucket(self._db)
                return self._fs
        except ImportError:
            pass
            
        # Fallback if DB not initialized yet (should happen in normal flow)
        if not self._client:
            self._client = AsyncIOMotorClient(settings.DATABASE_URL)
            self._db = self._client.get_database("change20_db")
            self._fs = AsyncIOMotorGridFSBucket(self._db)
        return self._fs
    
    async def upload_file(self, file_content: bytes, filename: str, content_type: str) -> str:
        """
        Upload file to GridFS and return file ID
        """
        try:
            file_id = await self.fs.upload_from_stream(
                filename,
                io.BytesIO(file_content),
                metadata={"content_type": content_type}
            )
            logger.info(f"Uploaded file {filename} with ID {file_id}")
            return str(file_id)
        except Exception as e:
            logger.error(f"Error uploading file {filename}: {e}")
            raise
    
    async def download_file(self, file_id: str) -> Tuple[bytes, str]:
        """
        Download file from GridFS
        Returns: (file_content, filename)
        """
        try:
            from bson import ObjectId
            grid_out = await self.fs.open_download_stream(ObjectId(file_id))
            content = await grid_out.read()
            filename = grid_out.filename
            return content, filename
        except Exception as e:
            logger.error(f"Error downloading file {file_id}: {e}")
            raise
    
    async def delete_file(self, file_id: str):
        """
        Delete file from GridFS
        """
        try:
            from bson import ObjectId
            await self.fs.delete(ObjectId(file_id))
            logger.info(f"Deleted file {file_id}")
        except Exception as e:
            logger.error(f"Error deleting file {file_id}: {e}")
            raise
    
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """
        Extract text from PDF file
        """
        try:
            pdf_reader = PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return ""
    
    def extract_text_from_docx(self, file_content: bytes) -> str:
        """
        Extract text from DOCX file
        """
        try:
            doc = docx.Document(io.BytesIO(file_content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            return ""
    
    def extract_text_from_txt(self, file_content: bytes) -> str:
        """
        Extract text from TXT file
        """
        try:
            return file_content.decode('utf-8').strip()
        except Exception as e:
            logger.error(f"Error extracting text from TXT: {e}")
            return ""
    
    async def upload_and_extract(self, file_content: bytes, filename: str, content_type: str) -> Tuple[str, str]:
        """
        Upload file and extract text content
        Returns: (file_id, extracted_text)
        """
        # Upload file
        file_id = await self.upload_file(file_content, filename, content_type)
        
        # Extract text based on file type
        extracted_text = ""
        if content_type == "application/pdf" or filename.lower().endswith('.pdf'):
            extracted_text = self.extract_text_from_pdf(file_content)
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or filename.lower().endswith('.docx'):
            extracted_text = self.extract_text_from_docx(file_content)
        elif content_type == "text/plain" or filename.lower().endswith('.txt'):
            extracted_text = self.extract_text_from_txt(file_content)
        else:
            logger.warning(f"Unsupported file type: {content_type}")
        
        return file_id, extracted_text

# file_storage_service = FileStorageService()
