import json
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.db.models import StudyPlan, TopicAnalytics, Topic, User

def generate_study_plan(db: Session, user_id: int, course_id: int, days_available: int, hours_per_day: float) -> StudyPlan:
    # Fetch topics ordered by importance
    analytics = db.query(TopicAnalytics).join(TopicAnalytics.topic).filter(Topic.unit.has(course_id=course_id)).order_by(TopicAnalytics.importance_score.desc()).all()
    
    schedule_data_dict = {"days": []}
    
    plan = StudyPlan(
        user_id=user_id,
        course_id=course_id,
        generated_at=datetime.now(),
        schedule_data=json.dumps(schedule_data_dict)
    )
    
    if not analytics:
        db.add(plan)
        db.commit()
        return plan
        
    total_importance = sum([a.importance_score for a in analytics]) if analytics else 1
    if total_importance == 0:
        total_importance = 1
        
    total_hours = days_available * hours_per_day
    
    current_day = 1
    hours_scheduled_today = 0.0
    daily_schedule = []
    
    # Simple proportional allocation
    for a in analytics:
        # Avoid zero allocation
        allocated_hours = max(0.5, (a.importance_score / total_importance) * total_hours)
        
        while allocated_hours > 0:
            time_chunk = min(allocated_hours, hours_per_day - hours_scheduled_today)
            daily_schedule.append({
                "topic_id": a.topic_id,
                "topic_name": a.topic.name,
                "hours": round(time_chunk, 1)
            })
            
            allocated_hours -= time_chunk
            hours_scheduled_today += time_chunk
            
            if hours_scheduled_today >= hours_per_day:
                plan.schedule_data["days"].append({"day": current_day, "tasks": daily_schedule})
                current_day += 1
                daily_schedule = []
                hours_scheduled_today = 0.0
                
            if current_day > days_available:
                break
        if current_day > days_available:
            break
            
    if daily_schedule:
        schedule_data_dict["days"].append({"day": current_day, "tasks": daily_schedule})
        
    plan.schedule_data = json.dumps(schedule_data_dict)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return plan
