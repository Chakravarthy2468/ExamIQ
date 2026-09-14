from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.api.dependencies import get_current_user
from app.services.study_planner import generate_study_plan

router = APIRouter()

@router.post("/generate/{course_id}")
def create_study_plan(course_id: int, days: int = 30, hours_per_day: float = 2.0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if days <= 0 or hours_per_day <= 0:
        raise HTTPException(status_code=400, detail="Days and hours must be positive")
        
    plan = generate_study_plan(db, current_user.id, course_id, days, hours_per_day)
    return {"plan_id": plan.id, "schedule": plan.schedule_data}
