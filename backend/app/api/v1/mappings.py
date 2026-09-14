from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import QuestionTopicMap, User
from app.api.dependencies import get_current_faculty

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_mappings(db: Session = Depends(get_db), current_user: User = Depends(get_current_faculty)) -> Any:
    # Just returning raw dicts for brevity, should use Pydantic models in production
    maps = db.query(QuestionTopicMap).all()
    return [{"id": m.id, "question_id": m.question_id, "topic_id": m.topic_id, "confidence": m.confidence_score, "approved": m.is_faculty_approved} for m in maps]

@router.put("/{mapping_id}/approve")
def approve_mapping(mapping_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_faculty)):
    mapping = db.query(QuestionTopicMap).filter(QuestionTopicMap.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    mapping.is_faculty_approved = True
    db.commit()
    return {"status": "approved"}
