import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found in environment")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

try:
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()
    
    print(f"Found {len(data.get('models', []))} models.")
    print("-" * 50)
    for model in data.get('models', []):
        name = model.get('name')
        display_name = model.get('displayName', 'No display name')
        supported_methods = model.get('supportedGenerationMethods', [])
        
        # Filter for video or likely candidates
        if 'generateVideo' in supported_methods or 'predict' in supported_methods or 'veo' in name.lower():
            print(f"Name: {name}")
            print(f"Display: {display_name}")
            print(f"Methods: {supported_methods}")
            print("-" * 30)

except Exception as e:
    print(f"Error listing models: {e}")
