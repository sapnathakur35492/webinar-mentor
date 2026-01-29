from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database_mongo import init_db
from dotenv import load_dotenv
import os

# Check current directory
print(f"DEBUG: CWD is {os.getcwd()}")
env_path = os.path.join(os.getcwd(), ".env")
print(f"DEBUG: Loading env from {env_path}")
load_dotenv(env_path)

key = os.getenv("OPENAI_API_KEY")
if not key:
    print("CRITICAL: OPENAI_API_KEY NOT FOUND!")
else:
    print(f"DEBUG: OPENAI_API_KEY found (starts with {key[:8]})")

from api.routers import webinar

app = FastAPI(title="Change 2.0 WebinarAgent.ai", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:3005",
        "https://devmentor.change20.no",
        "https://devwebinar.change20.no",
        "http://13.62.156.107:3005",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def start_db():
    await init_db()

@app.get("/health")
def health_check():
    print("Health check called (Reloaded 3)")
    return {"status": "ok", "service": "WebinarAgent.ai"}

# Register routers
from api.routers import auth, mentors, approvals
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(mentors.router, prefix="/api", tags=["Mentors"]) # Router already has /mentors prefix
app.include_router(webinar.router, prefix="/api/webinar", tags=["Webinar AI"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["Approvals"])
