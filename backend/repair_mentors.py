"""
Repair script: Link existing Mentor records to User records via user_id.
This fixes the 404 error: "GET /api/mentors/user/{user_id}" by populating the missing user_id field.
"""
import asyncio
import sys

sys.path.insert(0, ".")

async def repair_mentors():
    from motor.motor_asyncio import AsyncIOMotorClient
    from beanie import init_beanie
    from core.settings import settings
    from api.models import User, Mentor
    
    print("-" * 60)
    print("REPAIRING MENTORS: Linking to Users by Email")
    print("-" * 60)
    
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client["Change20-Dev"]
    await init_beanie(database=db, document_models=[User, Mentor])
    
    # Check all mentors
    mentors = await Mentor.find_all().to_list()
    print(f"Found {len(mentors)} mentors in total.")
    
    updated_count = 0
    for mentor in mentors:
        if not mentor.user_id or mentor.user_id == "":
            print(f"Searching for user with email: {mentor.Email}...")
            # Try to find user by email
            user = await User.find_one(User.email == mentor.Email)
            if user:
                mentor.user_id = str(user.id)
                await mentor.save()
                print(f"  SUCCESS: Linked Mentor {mentor.FullName} to User {user.id}")
                updated_count += 1
            else:
                print(f"  WARNING: No user found for email {mentor.Email}")
        else:
            print(f"Mentor {mentor.FullName} already has user_id: {mentor.user_id}")
            
    print("-" * 60)
    print(f"Repair complete. Updated {updated_count} mentors.")
    print("-" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(repair_mentors())
