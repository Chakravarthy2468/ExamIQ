from sqlalchemy.orm import Session
from app.db.models import StudyPlan, StudyPlanItem, TopicAnalytics
from typing import List

def update_item_status(db: Session, item_id: int, status: str) -> StudyPlanItem:
    item = db.query(StudyPlanItem).filter(StudyPlanItem.id == item_id).first()
    if not item:
        raise ValueError("Item not found")
        
    item.status = status
    db.commit()
    db.refresh(item)
    
    # Recalculate readiness
    recalculate_readiness_score(db, item.plan_id)
    return item

def recalculate_readiness_score(db: Session, plan_id: int):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
    if not plan:
        return
        
    items = db.query(StudyPlanItem).filter(StudyPlanItem.plan_id == plan_id).all()
    if not items:
        plan.readiness_score = 0.0
        db.commit()
        return
        
    total_importance = 0.0
    completed_importance = 0.0
    
    for item in items:
        analytics = db.query(TopicAnalytics).filter(TopicAnalytics.topic_id == item.topic_id).first()
        score = analytics.importance_score if analytics else 1.0
        
        total_importance += score
        if item.status == "COMPLETED":
            completed_importance += score
            
    if total_importance > 0:
        plan.readiness_score = round((completed_importance / total_importance) * 100, 2)
    else:
        plan.readiness_score = 0.0
        
    db.commit()
