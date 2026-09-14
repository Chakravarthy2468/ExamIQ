from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, documents, mappings, analytics, study_plans, mock_papers, evaluations, ai_tutor, progress, reports
from app.db.database import engine, Base

# Create tables for SQLite if not using alembic yet
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(mappings.router, prefix=f"{settings.API_V1_STR}/mappings", tags=["mappings"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(study_plans.router, prefix=f"{settings.API_V1_STR}/study_plans", tags=["study_plans"])
app.include_router(mock_papers.router, prefix=f"{settings.API_V1_STR}/mock_papers", tags=["mock_papers"])
app.include_router(evaluations.router, prefix=f"{settings.API_V1_STR}/evaluations", tags=["evaluations"])
app.include_router(ai_tutor.router, prefix=f"{settings.API_V1_STR}/ai_tutor", tags=["ai_tutor"])
app.include_router(progress.router, prefix=f"{settings.API_V1_STR}/progress", tags=["progress"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])

@app.get("/")
def read_root():
    return {"message": "Welcome to ExamIQ API"}
