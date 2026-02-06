import sys
import os

# Set up python path to include backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import asyncio
from api.services.did_service import did_service

async def verify_did_live():
    # Attempt to generate exactly like the app does
    text = "Assosiasjon: Salg føles påtrengende og ubehagelig. Ny overbevisning: Salg er den høyeste formen for tjeneste når du løser et ekte problem."
    
    print("--- LIVE D-ID SERVICE VERIFICATION ---")
    try:
        # We'll use the service directly
        res = did_service.create_talk(text)
        print(f"Result: {res}")
    except Exception as e:
        print(f"FAILED with exception: {e}")

if __name__ == "__main__":
    asyncio.run(verify_did_live())
