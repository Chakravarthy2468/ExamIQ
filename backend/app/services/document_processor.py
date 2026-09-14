import os
import shutil
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.db.models import Document, ProcessingJob, JobStatusEnum, DocumentTypeEnum
from app.ocr.parser import parse_pdf
from app.services.question_extractor import extract_questions_from_text

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DocumentProcessor:
    @staticmethod
    def validate_file(file: UploadFile):
        allowed_types = ["application/pdf", "image/jpeg", "image/png"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPG, PNG are supported.")
        
        # Read a chunk to check size? Fast API handles large files fine with SpooledTemporaryFile
        return True

    @staticmethod
    def save_upload_file(upload_file: UploadFile, dest_path: str):
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
    @staticmethod
    def process_document(db: Session, doc_id: int):
        job = db.query(ProcessingJob).filter(ProcessingJob.document_id == doc_id).first()
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not job or not doc:
            return
            
        job.status = JobStatusEnum.PROCESSING
        db.commit()
        
        try:
            if doc.file_path.endswith(".pdf"):
                extracted_text = parse_pdf(doc.file_path)
            else:
                # Handle image directly
                import cv2, pytesseract, numpy as np
                from PIL import Image
                img_cv = cv2.imread(doc.file_path)
                gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
                pil_img = Image.fromarray(thresh)
                extracted_text = pytesseract.image_to_string(pil_img)
            
            # Step 2: Extract questions if it's a question paper
            if doc.type == DocumentTypeEnum.QUESTION_PAPER:
                extract_questions_from_text(db, doc, extracted_text)
            elif doc.type == DocumentTypeEnum.SYLLABUS:
                # Syllabus extraction logic
                pass
                
            job.status = JobStatusEnum.COMPLETED
            job.progress_percent = 100.0
            doc.status = "COMPLETED"
            db.commit()
            
        except Exception as e:
            job.status = JobStatusEnum.FAILED
            job.error_message = str(e)
            doc.status = "FAILED"
            db.commit()
