import json
import re
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
        # Fallback to just using the topics if analytics are missing
        topics = db.query(Topic).filter(Topic.unit.has(course_id=course_id)).all()
        class DummyAnalytics:
            def __init__(self, topic_id, importance_score, name):
                self.topic_id = topic_id
                self.importance_score = importance_score
                self.topic = Topic(name=name)
                
        analytics = []
        import random
        for t in topics:
            analytics.append(DummyAnalytics(t.id, random.uniform(0.1, 1.0), t.name))
        
        # Sort by importance
        analytics.sort(key=lambda x: x.importance_score, reverse=True)
        
    total_importance = sum([a.importance_score for a in analytics]) if analytics else 1
    if total_importance == 0:
        total_importance = 1
        
    # Reserve last 10% of days (at least 1 day) for Revision & Mock Exams
    revision_days = max(1, int(days_available * 0.1))
    study_days = max(1, days_available - revision_days)
    total_study_hours = study_days * hours_per_day
    
    current_day = 1
    hours_scheduled_today = 0.0
    daily_schedule = []
    
    for a in analytics:
        # Clean topic name (remove leading numbers like "1.", "1.1", "- ")
        clean_name = re.sub(r'^[\d\.\-\s]+', '', a.topic.name)
        if not clean_name:
            clean_name = a.topic.name
            
        allocated_hours = (a.importance_score / total_importance) * total_study_hours
        
        # Cap a single topic to a maximum of 3 hours or the hours_per_day, whichever is smaller, so it doesn't drag on forever
        allocated_hours = min(allocated_hours, 3.0, hours_per_day)
        
        # Minimum chunk size is 0.5 hr to avoid micro-tasks
        allocated_hours = max(0.5, round(allocated_hours * 2) / 2.0)
        
        # If the topic doesn't fit in the remaining hours of today, move to the next day
        if allocated_hours > (hours_per_day - hours_scheduled_today) and hours_scheduled_today > 0:
            schedule_data_dict["days"].append({"day": current_day, "tasks": daily_schedule})
            current_day += 1
            daily_schedule = []
            hours_scheduled_today = 0.0
            
            if current_day > study_days:
                break
                
        # Now it fits in the current day perfectly
        time_chunk = allocated_hours
        daily_schedule.append({
            "topic_id": a.topic_id,
            "topic_name": clean_name.strip(),
            "module_name": a.topic.unit.title if a.topic.unit else "General Module",
            "marks": float(a.total_marks) if hasattr(a, 'total_marks') and a.total_marks else 0.0,
            "frequency": int(a.frequency) if hasattr(a, 'frequency') and a.frequency else 0,
            "hours": round(time_chunk, 1)
        })
        
        hours_scheduled_today += time_chunk
        
        if hours_scheduled_today >= hours_per_day - 0.1: # Account for floating point
            schedule_data_dict["days"].append({"day": current_day, "tasks": daily_schedule})
            current_day += 1
            daily_schedule = []
            hours_scheduled_today = 0.0
            
        if current_day > study_days:
            break
            
    if daily_schedule and current_day <= study_days:
        schedule_data_dict["days"].append({"day": current_day, "tasks": daily_schedule})
        current_day += 1
        
    # Add reserved Revision Days
    while current_day <= days_available:
        if current_day == days_available:
            task_name = "Full Course Revision & Final Mock Exam"
        else:
            task_name = "Take Mock Exams"
            
        schedule_data_dict["days"].append({
            "day": current_day, 
            "tasks": [{
                "topic_id": 0,
                "topic_name": task_name,
                "module_name": "Revision & Practice",
                "marks": 0.0,
                "frequency": 0,
                "hours": hours_per_day
            }]
        })
        current_day += 1
        
    plan.schedule_data = json.dumps(schedule_data_dict)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return plan
