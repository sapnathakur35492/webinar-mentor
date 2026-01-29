# Change 2.0 Backend API

## Overview
This is the backend API for the Change 2.0 Webinar Production Automation System. It orchestrates an AI-driven 3-phase workflow to transform mentor inputs into production-ready webinar assets.

## Architecture & Workflow
The system follows a strict 3-phase production pipeline:

1.  **Phase 1: Concept Development**
    *   Input: Onboarding Doc + Hook Analysis
    *   AI Output: Webinar Concept (Big Idea, Hooks, 3 Shifts)
    *   Review Loop: AI Critique -> Refinement -> Mentor Feedback (Transcript)

2.  **Phase 2: Structure Generation**
    *   Input: Approved Concept
    *   AI Output: 80-110 Slide Structure (Perfect Webinar Framework)
    *   Review Loop: AI Critique -> Refinement -> Mentor Feedback

3.  **Phase 3: Email Sequence**
    *   Input: Concept + Slide Structure
    *   AI Output: Full CRM-ready email sequence (Pre, Post, Sales)
    *   Review Loop: AI Critique -> Refinement

## Prerequisites
*   Docker & Docker Compose
*   OpenAI API Key

## Quick Start (Docker)

1.  **Clone the repository**
2.  **Set up environment variables:**
    ```bash
    cp .env.example .env
    # Edit .env and add your OPENAI_API_KEY
    ```
3.  **Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    The API will be available at `http://localhost:8000`.
    Swagger Documentation: `http://localhost:8000/docs`.

## Local Development Setup

1.  **Create virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run DB (if not using Docker):**
    Ensure PostgreSQL is running and update `DATABASE_URL` in `.env`.
4.  **Run Server:**
    ```bash
    uvicorn main:app --reload
    ```

## API Documentation

### Key Endpoints

*   **Mentors**
    *   `POST /mentors/` - Create a new mentor
    *   `POST /mentors/{id}/inputs` - Upload onboarding docs & hooks

*   **Projects - Phase 1 (Concept)**
    *   `POST /projects/concept/generate` - Generate initial concept
    *   `POST /projects/concept/critique` - Get AI critique
    *   `POST /projects/concept/refine` - Refine concept based on critique
    *   `POST /projects/concept/update-from-transcript` - Update from mentor feedback

*   **Projects - Phase 2 (Structure)**
    *   `POST /projects/structure/generate` - Generate slide structure
    *   `POST /projects/structure/critique` - Critique structure
    *   `POST /projects/structure/refine` - Refine structure

*   **Projects - Phase 3 (Emails)**
    *   `POST /projects/emails/generate` - Generate email sequence
    *   `POST /projects/emails/critique` - Critique email

*   **System**
    *   `GET /health` - System health check

## Testing
Run the verification script to test the full flow:
```bash
# Inside Docker container
docker-compose exec backend python test_apis.py
```

## Troubleshooting
*   **Database connection failed**: Ensure the `db` service is healthy in Docker.
*   **AI features not working**: detailed logs are available; check `OPENAI_API_KEY`.
