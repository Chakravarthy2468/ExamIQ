from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Course, User
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/")
def get_all_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    courses = db.query(Course).all()
    return [{"id": c.id, "name": c.name, "code": c.code} for c in courses]
