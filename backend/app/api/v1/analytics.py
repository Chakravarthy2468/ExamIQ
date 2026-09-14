from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import TopicAnalytics, User, Topic
from app.api.dependencies import get_current_user
from app.ml.analytics import compute_topic_analytics, calculate_syllabus_coverage

router = APIRouter()

@router.post("/compute/{course_id}")
def compute_analytics(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    compute_topic_analytics(db, course_id)
    return {"message": "Analytics computed successfully"}

@router.get("/dashboard/{course_id}")
def get_dashboard(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    coverage = calculate_syllabus_coverage(db, course_id)
    analytics = db.query(TopicAnalytics).join(TopicAnalytics.topic).filter(Topic.unit.has(course_id=course_id)).all()
    
    return {
        "coverage": coverage,
        "topics": [{"topic_id": a.topic_id, "importance": a.importance_score, "frequency": a.frequency, "marks": a.total_marks} for a in analytics],
        "disclaimer": "These values are historical importance estimates, not guaranteed exam predictions."
    }
