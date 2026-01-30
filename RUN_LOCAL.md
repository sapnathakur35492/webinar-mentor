# Local Testing (Backend 8000 + Frontend 3005)

## 1. Backend start karo
```powershell
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
* agar 8000 busy ho: `--port 8001` use karo aur frontend `.env.local` mein `VITE_API_BASE_URL=http://localhost:8001/api` set karo

## 2. Frontend start karo
```powershell
cd frontend/mentor-maestro-main
npm run dev
```
Frontend automatically port 3005 pe chalega (vite.config.ts mein set hai)

## 3. Browser mein open karo
http://localhost:3005

## 4. Test
- Login karo
- Webinar Concepts page pe jao
- "Generate New Options" click karo
- MOCK_OPENAI_MODE=true hai `.env` mein, toh demo concepts milenge (500 error nahi)

## Config files
- `backend/.env` - MOCK_OPENAI_MODE=true (OpenAI bypass)
- `frontend/mentor-maestro-main/.env.local` - VITE_API_BASE_URL=http://localhost:8000/api
