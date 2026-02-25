
import boto3
import os
from botocore.exceptions import ClientError
from core.settings import settings

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION
        )
        self.bucket_name = settings.AWS_S3_BUCKET_NAME

    async def upload_file(self, file_content, file_name, content_type):
        """
        Uploads a file to S3 and returns the public URL.
        """
        try:
            # Generate a unique path in S3: onboarding-docs/{filename}
            s3_path = f"onboarding-docs/{file_name}"
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_path,
                Body=file_content,
                ContentType=content_type,
                # ACL='public-read' # Commented out if bucket doesn't allow public ACLs, we'll use signed URLs or direct link if bucket is public
            )
            
            # Construct the S3 URL
            # Note: This assumes the bucket/object is publicly accessible. 
            # If not, a presigned URL would be better, but for this task a persistent link is requested.
            region_str = f".{settings.AWS_S3_REGION}" if settings.AWS_S3_REGION != "us-east-1" else ""
            url = f"https://{self.bucket_name}.s3{region_str}.amazonaws.com/{s3_path}"
            return url
            
        except ClientError as e:
            print(f"Error uploading to S3: {e}")
            raise e

s3_service = S3Service()
