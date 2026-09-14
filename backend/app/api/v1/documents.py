import os
import uuid
from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Document, ProcessingJob, DocumentTypeEnum
from app.api.dependencies import get_current_user
from app.services.document_processor import DocumentProcessor

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: DocumentTypeEnum = Form(...),
    course_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    DocumentProcessor.validate_file(file)
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    DocumentProcessor.save_upload_file(file, file_path)
    
    # Save Document record
    document = Document(
        user_id=current_user.id,
        course_id=course_id,
        type=doc_type,
        file_name=file.filename,
        file_path=file_path,
        status="UPLOADED"
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Create ProcessingJob
    job = ProcessingJob(document_id=document.id)
    db.add(job)
    db.commit()
    
    # Send processing to background
    background_tasks.add_task(DocumentProcessor.process_document, db, document.id)
    
    return {"message": "File uploaded successfully, processing started.", "document_id": document.id}

@router.get("/{doc_id}/status")
def get_document_status(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(ProcessingJob).filter(ProcessingJob.document_id == doc_id).first()
    if not job:
        return {"error": "Job not found"}
    return {
        "status": job.status,
        "progress": job.progress_percent,
        "error": job.error_message
    }
