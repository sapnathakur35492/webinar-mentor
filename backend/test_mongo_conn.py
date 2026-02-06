from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

async def test_conn():
    load_dotenv()
    uri = os.getenv("DATABASE_URL")
    print(f"Testing URI: {uri[:20]}...")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        info = await client.server_info()
        print("Connected successfully!")
        print(f"Server Info: {info.get('version')}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
