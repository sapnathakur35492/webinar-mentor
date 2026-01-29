import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.getcwd())

from database_mongo import init_db
from api import models
from core import security
from api.schemas import UserCreate
from pydantic import ValidationError

async def debug_registration():
    print("--- Starting Debug Registration ---")
    try:
        print("Initializing DB...")
        await init_db()
        print("DB Initialized.")
        
        user_in = UserCreate(
            name="Debug User",
            email="debug_user@example.com",
            password="password123"
        )
        print(f"Creating user object: {user_in}")

        print("Hashing password...")
        hashed = security.get_password_hash(user_in.password)
        print(f"Password Hashed: {hashed[:10]}...")

        print("Checking if user exists...")
        existing_user = await models.User.find_one({"email": user_in.email})
        if existing_user:
            print("User already exists, deleting for test...")
            await existing_user.delete()

        print("Inserting new user...")
        user = models.User(
            name=user_in.name,
            email=user_in.email,
            password_hash=hashed,
            role="user"
        )
        await user.insert()
        print("User inserted successfully!")
        
    except Exception as e:
        print("\n!!! ERROR OCCURRED !!!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Ensure we are in the backend directory context
    if "backend" not in os.getcwd():
        print("Please run this script from the backend directory.")
    else:
        asyncio.run(debug_registration())
