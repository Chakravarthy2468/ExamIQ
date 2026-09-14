import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Enum, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class RoleEnum(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    ADMIN = "ADMIN"

class DocumentTypeEnum(str, enum.Enum):
    QUESTION_PAPER = "QUESTION_PAPER"
    SYLLABUS = "SYLLABUS"
    COURSE_OUTCOME = "COURSE_OUTCOME"
    LESSON_PLAN = "LESSON_PLAN"
    ANSWER_SUBMISSION = "ANSWER_SUBMISSION"

class JobStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.STUDENT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    university = relationship("University")
    documents = relationship("Document", back_populates="user")
    study_plans = relationship("StudyPlan", back_populates="user")

class University(Base):
    __tablename__ = "universities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    location = Column(String)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, index=True, nullable=False)
    semester = Column(Integer)
    
    university = relationship("University")
    units = relationship("Unit", back_populates="course")

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    unit_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    
    course = relationship("Course", back_populates="units")
    topics = relationship("Topic", back_populates="unit")

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    
    unit = relationship("Unit", back_populates="topics")
    analytics = relationship("TopicAnalytics", back_populates="topic", uselist=False)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    type = Column(Enum(DocumentTypeEnum), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, default="UPLOADED") # e.g. UPLOADED, PROCESSING, COMPLETED, FAILED
    
    user = relationship("User", back_populates="documents")
    course = relationship("Course")
    question_paper = relationship("QuestionPaper", back_populates="document", uselist=False)
    processing_job = relationship("ProcessingJob", back_populates="document", uselist=False)

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, unique=True)
    status = Column(Enum(JobStatusEnum), default=JobStatusEnum.PENDING)
    progress_percent = Column(Float, default=0.0)
    result_metadata = Column(Text, nullable=True) # JSON string
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    document = relationship("Document", back_populates="processing_job")

class QuestionPaper(Base):
    __tablename__ = "question_papers"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, unique=True)
    exam_year = Column(Integer)
    semester = Column(String)
    exam_type = Column(String)
    total_marks = Column(Float)
    
    document = relationship("Document", back_populates="question_paper")
    questions = relationship("Question", back_populates="paper")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    question_number = Column(String)
    question_text = Column(Text, nullable=False)
    marks = Column(Float)
    question_type = Column(String)
    difficulty = Column(String)
    
    paper = relationship("QuestionPaper", back_populates="questions")
    mappings = relationship("QuestionTopicMap", back_populates="question")

class QuestionTopicMap(Base):
    __tablename__ = "question_topic_maps"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    similarity_score = Column(Float)
    confidence_score = Column(Float)
    mapping_method = Column(String) # e.g. 'SEMANTIC', 'MANUAL'
    is_faculty_approved = Column(Boolean, default=False)
    
    question = relationship("Question", back_populates="mappings")
    topic = relationship("Topic")

class TopicAnalytics(Base):
    __tablename__ = "topic_analytics"
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False, unique=True)
    frequency = Column(Integer, default=0)
    total_marks = Column(Float, default=0.0)
    importance_score = Column(Float)
    confidence_score = Column(Float)
    trend = Column(String)
    
    topic = relationship("Topic", back_populates="analytics")

class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    exam_date = Column(DateTime)
    study_hours_per_day = Column(Float)
    readiness_score = Column(Float)
    generated_at = Column(DateTime, default=datetime.utcnow)
    schedule_data = Column(Text) # Stored as JSON
    
    user = relationship("User", back_populates="study_plans")
    course = relationship("Course")
    items = relationship("StudyPlanItem", back_populates="plan")

class StudyPlanItem(Base):
    __tablename__ = "study_plan_items"
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    scheduled_date = Column(DateTime)
    priority_order = Column(Integer)
    status = Column(String, default="PENDING")
    
    plan = relationship("StudyPlan", back_populates="items")
    topic = relationship("Topic")

class MockPaper(Base):
    __tablename__ = "mock_papers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    total_marks = Column(Float)
    difficulty_constraint = Column(String)
    
    user = relationship("User")
    course = relationship("Course")
    questions = relationship("MockPaperQuestion", back_populates="mock_paper")

class MockPaperQuestion(Base):
    __tablename__ = "mock_paper_questions"
    id = Column(Integer, primary_key=True, index=True)
    mock_paper_id = Column(Integer, ForeignKey("mock_papers.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    historical_question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    question_number = Column(String)
    question_type = Column(String)
    question_text = Column(Text, nullable=False)
    marks = Column(Float)
    difficulty = Column(String)
    
    mock_paper = relationship("MockPaper", back_populates="questions")
    topic = relationship("Topic")

class AnswerSubmission(Base):
    __tablename__ = "answer_submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    historical_question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    mock_question_id = Column(Integer, ForeignKey("mock_paper_questions.id"), nullable=True)
    file_path = Column(String, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    historical_question = relationship("Question")
    mock_question = relationship("MockPaperQuestion")
    evaluation = relationship("AnswerEvaluation", back_populates="submission", uselist=False)

class AnswerEvaluation(Base):
    __tablename__ = "answer_evaluations"
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("answer_submissions.id"), nullable=False, unique=True)
    obtained_marks = Column(Float) # AI-assisted estimated marks
    completeness = Column(Float)
    missing_concepts = Column(Text)
    feedback = Column(Text)
    
    submission = relationship("AnswerSubmission", back_populates="evaluation")

class AISession(Base):
    __tablename__ = "ai_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    topic = relationship("Topic")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_type = Column(String) # PDF, EXCEL
    file_path = Column(String, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
