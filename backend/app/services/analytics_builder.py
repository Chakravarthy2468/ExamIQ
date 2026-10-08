import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import Course, Topic, Question, QuestionTopicMap, TopicAnalytics, Document

logger = logging.getLogger(__name__)

def map_and_calculate_analytics(db: Session, course_id: int):
    # Get all topics for course
    topics = db.query(Topic).filter(Topic.unit.has(course_id=course_id)).all()
    if not topics:
        return
        
    # Get all questions for course
    questions = db.query(Question).join(Question.paper).join(Document).filter(Document.course_id == course_id).all()
    if not questions:
        return
        
    # Super basic mapping: keywords matching
    for q in questions:
        # Check if already mapped
        existing_map = db.query(QuestionTopicMap).filter(QuestionTopicMap.question_id == q.id).first()
        if existing_map:
            continue
            
        best_topic = None
        best_score = -1
        
        q_text = q.question_text.lower()
        for t in topics:
            score = 0
            words = t.name.lower().split()
            for w in words:
                if len(w) > 3 and w in q_text:
                    score += 1
            if score > best_score:
                best_score = score
                best_topic = t
                
        # Fallback to a random topic if no match found
        if best_score <= 0 and topics:
            import random
            best_topic = random.choice(topics)
                
        if best_topic:
            mapping = QuestionTopicMap(question_id=q.id, topic_id=best_topic.id)
            db.add(mapping)
            
    db.commit()
    
    # Calculate TopicAnalytics
    # Delete existing
    from app.db.models import Unit
    db.query(TopicAnalytics).filter(TopicAnalytics.topic.has(Topic.unit.has(course_id=course_id))).delete(synchronize_session=False)
    db.commit()
    
    # Count mappings and sum marks
    results = db.query(
        QuestionTopicMap.topic_id,
        func.count(QuestionTopicMap.id).label('frequency'),
        func.sum(Question.marks).label('total_marks')
    ).join(Question, QuestionTopicMap.question_id == Question.id)\
     .join(Topic, QuestionTopicMap.topic_id == Topic.id)\
     .filter(Topic.unit.has(course_id=course_id))\
     .group_by(QuestionTopicMap.topic_id).all()
    
    if not results:
        return
        
    max_marks = max((r.total_marks or 0) for r in results) if results else 1
    if max_marks == 0: max_marks = 1
    
    for r in results:
        t_marks = r.total_marks or 0
        importance = t_marks / max_marks # normalized 0-1 based on marks
        if importance == 0 and r.frequency > 0:
            importance = 0.1 # Minimum importance if it appeared but had no marks extracted
            
        analytics = TopicAnalytics(
            topic_id=r.topic_id,
            frequency=r.frequency,
            total_marks=t_marks,
            importance_score=importance,
            trend="Stable",
            confidence_score=0.8
        )
        db.add(analytics)
        
    db.commit()
