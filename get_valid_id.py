import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def get_id():
    client = AsyncIOMotorClient(os.getenv("DATABASE_URL"))
    db = client.get_default_database()
    asset = await db["webinar_assets"].find_one()
    if asset:
        with open("asset_id.txt", "w") as f:
            f.write(str(asset["_id"]))
        print(f"Saved ID: {asset['_id']}")
    else:
        print("No assets found")

if __name__ == "__main__":
    asyncio.run(get_id())
