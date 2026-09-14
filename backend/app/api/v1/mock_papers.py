from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.api.dependencies import get_current_user
from app.services.mock_paper import generate_mock_paper

router = APIRouter()

@router.post("/generate/{course_id}")
def create_mock_paper(course_id: int, difficulty: str = "MEDIUM", total_marks: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if difficulty not in ["EASY", "MEDIUM", "HARD"]:
        raise HTTPException(status_code=400, detail="Invalid difficulty")
        
    paper = generate_mock_paper(db, current_user.id, course_id, difficulty, total_marks)
    return {"paper_id": paper.id, "message": "Mock paper generated"}
