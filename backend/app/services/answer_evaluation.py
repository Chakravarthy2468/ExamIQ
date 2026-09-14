import json
import logging
from sqlalchemy.orm import Session
from app.db.models import AnswerSubmission, AnswerEvaluation, Question, MockPaperQuestion, Topic
from app.nlp.ai_provider import get_ai_provider

logger = logging.getLogger(__name__)

def evaluate_answer(db: Session, submission_id: int) -> AnswerEvaluation:
    submission = db.query(AnswerSubmission).filter(AnswerSubmission.id == submission_id).first()
    if not submission:
        raise ValueError("Submission not found")
        
    # Check if already evaluated
    if submission.evaluation:
        return submission.evaluation
        
    # Gather context
    question_text = ""
    max_marks = 10.0
    topic_context = ""
    
    if submission.historical_question_id:
        q = db.query(Question).filter(Question.id == submission.historical_question_id).first()
        question_text = q.question_text
        max_marks = q.marks if q.marks else 10.0
        
        # Get topic context
        if q.mappings and len(q.mappings) > 0:
            top_mapping = sorted(q.mappings, key=lambda m: m.confidence_score or 0.0, reverse=True)[0]
            topic = db.query(Topic).filter(Topic.id == top_mapping.topic_id).first()
            if topic:
                topic_context = f"Topic: {topic.name}\nDescription: {topic.description}"
                
    elif submission.mock_question_id:
        mq = db.query(MockPaperQuestion).filter(MockPaperQuestion.id == submission.mock_question_id).first()
        question_text = mq.question_text
        max_marks = mq.marks if mq.marks else 10.0
        if mq.topic_id:
            topic = db.query(Topic).filter(Topic.id == mq.topic_id).first()
            if topic:
                topic_context = f"Topic: {topic.name}\nDescription: {topic.description}"
                
    else:
        raise ValueError("Submission must link to either a historical question or mock question")
        
    # TODO: Fetch student's actual text from file_path via OCR if it's an image.
    # For now, we assume the student's text is provided or mock a submission text.
    # We will simulate the student text based on the file_path for now.
    student_text = "This is the student's submitted answer text."
    
    prompt = f"""
    You are an expert university professor evaluating a student's answer.
    
    Question: {question_text}
    Max Marks: {max_marks}
    
    Syllabus Context:
    {topic_context}
    
    Student Answer:
    {student_text}
    """
    
    system_prompt = """
    Evaluate the student's answer based on correctness, completeness, and relevance.
    Output JSON exactly with the following keys:
    - obtained_marks: float (between 0 and max marks)
    - completeness: float (percentage 0-100)
    - missing_concepts: string (brief description of what is missing)
    - feedback: string (constructive feedback)
    - confidence: float (0.0 to 1.0, your confidence in this evaluation)
    - requires_human_review: boolean (true if answer is vague, ambiguous, or hard to grade)
    """
    
    ai = get_ai_provider()
    
    try:
        response_str = ai.generate_response(prompt, system_prompt=system_prompt, json_format=True)
        # Some models return markdown wrapped JSON, strip it
        if response_str.startswith("```json"):
            response_str = response_str.strip("```json").strip("```").strip()
            
        data = json.loads(response_str)
        
        obtained_marks = float(data.get("obtained_marks", 0.0))
        # Validate marks
        obtained_marks = max(0.0, min(obtained_marks, max_marks))
        
        evaluation = AnswerEvaluation(
            submission_id=submission_id,
            obtained_marks=obtained_marks,
            completeness=float(data.get("completeness", 0.0)),
            missing_concepts=data.get("missing_concepts", ""),
            feedback=data.get("feedback", ""),
            model_metadata=json.dumps({"provider": ai.__class__.__name__}),
            confidence_score=float(data.get("confidence", 0.9)),
            requires_human_review=bool(data.get("requires_human_review", True))
        )
        
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        return evaluation
        
    except Exception as e:
        logger.error(f"AI Evaluation failed: {str(e)}")
        # Fallback or record failed evaluation
        evaluation = AnswerEvaluation(
            submission_id=submission_id,
            obtained_marks=0.0,
            completeness=0.0,
            missing_concepts="Error during AI evaluation",
            feedback=f"Failed to evaluate: {str(e)}",
            requires_human_review=True,
            model_metadata=json.dumps({"error": str(e)})
        )
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        return evaluation
