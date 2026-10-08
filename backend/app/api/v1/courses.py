from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Course, User
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/")
def get_all_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    return [{"id": c.id, "name": c.name, "code": c.code} for c in courses]

@router.delete("/{course_id}/reset")
def reset_course_data(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.db.models import Document, QuestionPaper, Question, QuestionTopicMap, Topic, Unit, TopicAnalytics, StudyPlan, MockPaper, MockPaperQuestion
    
    # Delete study plans
    db.query(StudyPlan).filter(StudyPlan.course_id == course_id).delete(synchronize_session=False)
    
    # Delete mock papers
    mock_papers = db.query(MockPaper).filter(MockPaper.course_id == course_id).all()
    for mp in mock_papers:
        db.query(MockPaperQuestion).filter(MockPaperQuestion.mock_paper_id == mp.id).delete(synchronize_session=False)
        db.delete(mp)
        
    # Delete analytics and topics
    units = db.query(Unit).filter(Unit.course_id == course_id).all()
    for u in units:
        topics = db.query(Topic).filter(Topic.unit_id == u.id).all()
        for t in topics:
            db.query(TopicAnalytics).filter(TopicAnalytics.topic_id == t.id).delete(synchronize_session=False)
            db.query(QuestionTopicMap).filter(QuestionTopicMap.topic_id == t.id).delete(synchronize_session=False)
            db.delete(t)
        db.delete(u)
        
    # Delete documents and questions
    docs = db.query(Document).filter(Document.course_id == course_id).all()
    for d in docs:
        papers = db.query(QuestionPaper).filter(QuestionPaper.document_id == d.id).all()
        for p in papers:
            # QuestionTopicMap is already deleted above
            db.query(Question).filter(Question.paper_id == p.id).delete(synchronize_session=False)
            db.delete(p)
        db.delete(d)
        
    # Delete the Course itself
    course = db.query(Course).filter(Course.id == course_id).first()
    if course:
        db.delete(course)
        
    db.commit()
    return {"message": "Successfully deleted the course and all associated data."}
