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
    
    # Fetch already used questions across previous mock tests for this user and course
    previous_papers = db.query(MockPaper).filter(MockPaper.user_id == user_id, MockPaper.course_id == course_id).all()
    previous_paper_ids = [p.id for p in previous_papers]
    
    used_questions = db.query(MockPaperQuestion.historical_question_id).filter(
        MockPaperQuestion.mock_paper_id.in_(previous_paper_ids)
    ).all() if previous_paper_ids else []
    
    selected_question_ids = {uq[0] for uq in used_questions if uq[0] is not None}
    current_marks = 0
    q_num = 1
    
    if analytics:
        for a in analytics:
            if current_marks >= total_marks:
                break
                
            # Get a question for this topic
            q = db.query(Question).join(QuestionTopicMap).filter(
                QuestionTopicMap.topic_id == a.topic_id,
                ~Question.id.in_(selected_question_ids)
            ).order_by(func.random()).first()
            
            if q:
                q_marks = q.marks if q.marks else 10.0
                if current_marks + q_marks <= total_marks + 5:
                    mq = MockPaperQuestion(
                        mock_paper_id=paper.id,
                        historical_question_id=q.id,
                        question_number=f"Q{q_num}",
                        question_text=q.question_text,
                        question_type="DESCRIPTIVE",
                        difficulty="MEDIUM",
                        marks=q_marks
                    )
                    db.add(mq)
                    selected_question_ids.add(q.id)
                    current_marks += q_marks
                    q_num += 1
    
    # Fallback if we still need marks (or no analytics available)
    if current_marks < total_marks:
        from app.db.models import Document
        fallback_questions = db.query(Question).join(Question.paper).join(Document).filter(
            Document.course_id == course_id,
            ~Question.id.in_(selected_question_ids)
        ).order_by(func.random()).limit(10).all()
        
        for q in fallback_questions:
            if current_marks >= total_marks:
                break
            q_marks = q.marks if q.marks else 10.0
            if current_marks + q_marks <= total_marks + 10:
                mq = MockPaperQuestion(
                    mock_paper_id=paper.id,
                    historical_question_id=q.id,
                    question_number=f"Q{q_num}",
                    question_text=q.question_text,
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
