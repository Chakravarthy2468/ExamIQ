import pandas as pd
from sqlalchemy.orm import Session
from app.db.models import TopicAnalytics, QuestionTopicMap, Question, Topic, QuestionPaper, Document
from sqlalchemy import func

def compute_topic_analytics(db: Session, course_id: int):
    # Get all mappings for a course
    query = db.query(
        Topic.id.label("topic_id"),
        func.count(Question.id).label("frequency"),
        func.sum(Question.marks).label("total_marks")
    ).join(QuestionTopicMap, Topic.id == QuestionTopicMap.topic_id)\
     .join(Question, QuestionTopicMap.question_id == Question.id)\
     .join(QuestionPaper, Question.paper_id == QuestionPaper.id)\
     .join(QuestionPaper.document)\
     .filter(Document.course_id == course_id)\
     .group_by(Topic.id)
     
    results = query.all()
    
    if not results:
        return
        
    df = pd.DataFrame(results)
    
    # Simple Importance Estimation (w1*freq + w2*marks)
    # Normalize
    df['freq_norm'] = df['frequency'] / df['frequency'].max() if df['frequency'].max() > 0 else 0
    df['marks_norm'] = df['total_marks'] / df['total_marks'].max() if df['total_marks'].max() > 0 else 0
    
    w1, w2 = 0.6, 0.4
    df['importance_score'] = w1 * df['freq_norm'] + w2 * df['marks_norm']
    
    for _, row in df.iterrows():
        analytics = db.query(TopicAnalytics).filter(TopicAnalytics.topic_id == row['topic_id']).first()
        if not analytics:
            analytics = TopicAnalytics(topic_id=row['topic_id'])
            db.add(analytics)
            
        analytics.frequency = int(row['frequency'])
        analytics.total_marks = float(row['total_marks'] if pd.notna(row['total_marks']) else 0.0)
        analytics.importance_score = float(row['importance_score'])
        analytics.confidence_score = 0.8 # Based on historical volume
        analytics.trend = "STABLE"
        
    db.commit()

def calculate_syllabus_coverage(db: Session, course_id: int):
    total_topics = db.query(Topic).join(Topic.unit).filter(Topic.unit.has(course_id=course_id)).count()
    covered_topics = db.query(TopicAnalytics).join(TopicAnalytics.topic).join(Topic.unit).filter(Topic.unit.has(course_id=course_id)).filter(TopicAnalytics.frequency > 0).count()
    
    if total_topics == 0:
        return 0.0
    return (covered_topics / total_topics) * 100.0
