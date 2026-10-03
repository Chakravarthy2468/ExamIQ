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

@router.get("/")
def list_mock_papers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.db.models import MockPaper
    papers = db.query(MockPaper).filter(MockPaper.user_id == current_user.id).order_by(MockPaper.created_at.desc()).all() if hasattr(MockPaper, 'created_at') else db.query(MockPaper).filter(MockPaper.user_id == current_user.id).all()
    return [{"id": p.id, "course_id": p.course_id, "generated_at": p.generated_at, "total_marks": p.total_marks, "difficulty": p.difficulty_constraint} for p in papers]

@router.get("/{paper_id}")
def get_mock_paper(paper_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.db.models import MockPaper, MockPaperQuestion
    paper = db.query(MockPaper).filter(MockPaper.id == paper_id, MockPaper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Mock paper not found")
    questions = db.query(MockPaperQuestion).filter(MockPaperQuestion.mock_paper_id == paper.id).all()
    return {
        "id": paper.id,
        "course_id": paper.course_id,
        "total_marks": paper.total_marks,
        "difficulty": paper.difficulty_constraint,
        "generated_at": paper.generated_at,
        "questions": [{"id": q.id, "text": q.question_text, "marks": q.marks} for q in questions]
    }
