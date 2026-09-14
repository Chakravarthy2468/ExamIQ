# ExamIQ: AI-Powered Exam Intelligence Platform

ExamIQ is an advanced, AI-driven educational platform designed to enhance student preparation and provide deep analytics for faculty and administrators. It uses local Generative AI (Ollama + Qwen3:8b) to evaluate subjective answers, generate mock exams from historical question papers (PYQs), and build personalized study plans based on the syllabus.

## Core Features

- **Document Ingestion:** Upload and process Syllabus and Previous Year Question (PYQ) PDFs.
- **AI Answer Evaluation:** Students submit answers to mock questions and receive immediate feedback, including estimated marks and missing concepts, powered by a local Ollama integration.
- **Faculty Dashboard:** Role-Based Access Control (RBAC) allows Faculty members to view assigned students, review AI evaluations, and override grades when human intervention is needed.
- **Admin Dashboard:** Monitor system health (DB, API, Ollama), view system-wide audit logs, and manage user roles globally.
- **Progress Reports:** Generate comprehensive PDF readiness reports, complete with Responsible AI disclosures.
- **Data Privacy & Security:** Employs JWT authentication, RBAC, exception handling to prevent stack-trace leaks, and an offline-first AI approach for maximum privacy.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy (SQLite), PyTest, PyMuPDF
- **Frontend:** React, TypeScript, Vite, Axios, React Router
- **AI Integration:** Local Ollama running `qwen3:8b` model (Extensible via an AIProvider abstraction)
- **Reporting:** FPDF for generating PDF performance reports

## Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js & npm
- [Ollama](https://ollama.com/) installed with the `qwen3:8b` model downloaded (`ollama run qwen3:8b`)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will be available at `http://localhost:8000`. API documentation is automatically generated at `http://localhost:8000/docs`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Testing

The project includes an extensive PyTest suite that covers unit, integration, security, and real End-to-End (E2E) workflows.

```bash
cd backend
python -m pytest tests/
```
*(To run the E2E tests, ensure your local Ollama instance is running and the `E2E_FIXTURE_DIR` environment variable points to a valid syllabus/PYQ fixture directory).*

## Security & Responsible AI

ExamIQ implements strict Role-Based Access Control (RBAC). Faculty and Administrative actions are tracked securely via Audit Logs. Furthermore, all AI-generated feedback and performance reports are explicitly marked with a **Responsible AI Disclosure**, reinforcing that AI evaluations are advisory and should not be treated as official grading without faculty consensus.
