import asyncio
import os
from dotenv import load_dotenv
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from database_mongo import init_db
from api import models, schemas
from api.routers import auth
from pydantic import ValidationError

async def test_reg():
    load_dotenv()
    await init_db()
    
    user_in = schemas.UserCreate(
        name="Test User",
        email=f"test_{os.urandom(4).hex()}@example.com",
        password="testpassword123"
    )
    
    try:
        result = await auth.register(user_in)
        print("Registration Success:", result)
    except Exception as e:
        print("Registration Failed!")
        print(f"Type: {type(e).__name__}")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_reg())
