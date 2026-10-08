from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.api.dependencies import get_current_user
from app.services.progress import update_item_status
from pydantic import BaseModel

router = APIRouter()

class StatusUpdate(BaseModel):
    status: str # e.g. COMPLETED, PENDING, IN_PROGRESS

@router.put("/item/{item_id}")
def mark_item_status(item_id: int, req: StatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        item = update_item_status(db, item_id, req.status)
        return {"item_id": item.id, "new_status": item.status, "readiness_score": item.plan.readiness_score}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

from app.db.models import AnswerEvaluation, AnswerSubmission, MockPaperQuestion, Topic

@router.get("/readiness")
def get_user_readiness(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    submissions = db.query(AnswerSubmission).filter(AnswerSubmission.user_id == current_user.id).all()
    
    total_obtained = 0.0
    total_max = 0.0
    
    topic_scores = {}
    
    for sub in submissions:
        eval = db.query(AnswerEvaluation).filter(AnswerEvaluation.submission_id == sub.id).first()
        if not eval:
            continue
            
        q = db.query(MockPaperQuestion).filter(MockPaperQuestion.id == sub.mock_question_id).first()
        if not q or not q.marks or q.marks <= 0:
            continue
            
        total_obtained += eval.obtained_marks or 0.0
        total_max += q.marks
        
        if q.topic_id:
            if q.topic_id not in topic_scores:
                topic_scores[q.topic_id] = {"obtained": 0.0, "max": 0.0}
            topic_scores[q.topic_id]["obtained"] += eval.obtained_marks or 0.0
            topic_scores[q.topic_id]["max"] += q.marks
            
    overall = (total_obtained / total_max * 100) if total_max > 0 else 0.0
    
    strong_areas = []
    needs_attention = []
    
    for t_id, scores in topic_scores.items():
        if scores["max"] > 0:
            pct = scores["obtained"] / scores["max"]
            topic = db.query(Topic).filter(Topic.id == t_id).first()
            topic_name = topic.name if topic else f"Topic {t_id}"
            
            if pct >= 0.7:
                strong_areas.append(topic_name)
            elif pct < 0.5:
                needs_attention.append(topic_name)
                
    return {
        "overall_readiness": round(overall),
        "strong_areas": strong_areas[:3], # top 3
        "needs_attention": needs_attention[:3]
    }
