import random
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from app.db.models import MockPaper, MockPaperQuestion, TopicAnalytics, QuestionTopicMap, Question, Topic

def generate_mock_paper(db: Session, user_id: int, course_id: int, difficulty: str, total_marks: int = 100) -> MockPaper:
    # Basic logic: Select questions based on topic importance to fill the marks
    # Difficulty is tricky without cold-start data, so we'll randomize or pick randomly for now
    
    paper = MockPaper(
        user_id=user_id,
        course_id=course_id,
        difficulty_constraint=difficulty,
        total_marks=total_marks
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    
    # Get high importance topics
    analytics = db.query(TopicAnalytics).join(TopicAnalytics.topic).filter(Topic.unit.has(course_id=course_id)).order_by(TopicAnalytics.importance_score.desc()).all()
    
    current_marks = 0
    selected_question_ids = set()
    q_num = 1
    
    for a in analytics:
        if current_marks >= total_marks:
            break
            
        # Get a question for this topic
        q = db.query(Question).join(QuestionTopicMap).filter(
            QuestionTopicMap.topic_id == a.topic_id,
            ~Question.id.in_(selected_question_ids)
        ).order_by(func.random()).first()
        
        if q:
            # Estimate marks if null
            q_marks = q.marks if q.marks else 10.0
            
            # Avoid exceeding too much, but allow slight overfill for last question
            if current_marks + q_marks <= total_marks + 5:
                mq = MockPaperQuestion(
                    mock_paper_id=paper.id,
                    historical_question_id=q.id,
                    question_number=f"Q{q_num}",
                    question_type="DESCRIPTIVE",
                    difficulty="MEDIUM",
                    marks=q_marks
                )
                db.add(mq)
                selected_question_ids.add(q.id)
                current_marks += q_marks
                q_num += 1
                
    db.commit()
    return paper
