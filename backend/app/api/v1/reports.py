from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Report
from app.api.dependencies import get_current_user
from app.services.reports import generate_pdf_report, generate_excel_report
import os

router = APIRouter()

@router.post("/generate/{course_id}/pdf")
def create_pdf(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = generate_pdf_report(db, current_user.id, course_id)
    return {"report_id": report.id, "file_path": report.file_path}

@router.post("/generate/{course_id}/excel")
def create_excel(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = generate_excel_report(db, current_user.id, course_id)
    return {"report_id": report.id, "file_path": report.file_path}

@router.get("/download/{report_id}")
def download_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="File missing on server")
        
    return FileResponse(report.file_path, filename=os.path.basename(report.file_path))
