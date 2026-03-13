import asyncio
import httpx
from core.settings import settings

async def test_openai():
    api_key = settings.OPENAI_API_KEY
    endpoint = "https://api.openai.com/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "Say hello world"}
        ],
        "max_tokens": 10
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_openai())
