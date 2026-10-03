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
    
    # Count mappings
    counts = db.query(QuestionTopicMap.topic_id, func.count(QuestionTopicMap.id)).join(Topic).filter(Topic.unit.has(course_id=course_id)).group_by(QuestionTopicMap.topic_id).all()
    
    if not counts:
        return
        
    max_count = max(c[1] for c in counts) if counts else 1
    
    for topic_id, count in counts:
        importance = count / max_count # normalized 0-1
        analytics = TopicAnalytics(
            topic_id=topic_id,
            importance_score=importance,
            trend="Stable",
            confidence_score=0.8
        )
        db.add(analytics)
        
    db.commit()
