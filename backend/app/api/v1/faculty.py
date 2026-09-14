from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.database import get_db
from app.db.models import User, CourseFacultyMap, CourseEnrollment, AnswerEvaluation, AuditLog
from app.api.dependencies import get_current_faculty
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class OverrideRequest(BaseModel):
    final_marks: float
    override_reason: str

@router.get("/students")
def get_enrolled_students(db: Session = Depends(get_db), current_user: User = Depends(get_current_faculty)):
    # Get courses assigned to this faculty
    faculty_courses = db.query(CourseFacultyMap.course_id).filter(CourseFacultyMap.faculty_id == current_user.id).all()
    course_ids = [c[0] for c in faculty_courses]
    
    if not course_ids:
        return []
        
    # Get students enrolled in those courses
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.course_id.in_(course_ids)).all()
    student_ids = list(set([e.student_id for e in enrollments]))
    
    students = db.query(User).filter(User.id.in_(student_ids)).all()
    return [{"id": s.id, "full_name": s.full_name, "email": s.email} for s in students]

@router.get("/evaluations/review")
def get_evaluations_for_review(db: Session = Depends(get_db), current_user: User = Depends(get_current_faculty)):
    # Get evaluations flagged for human review, filtered by courses this faculty manages
    # (Implementation simplification: returning all requires_human_review for now, ideally filter by course)
    # Let's filter by course to satisfy RBAC
    faculty_courses = db.query(CourseFacultyMap.course_id).filter(CourseFacultyMap.faculty_id == current_user.id).all()
    course_ids = [c[0] for c in faculty_courses]
    
    # Needs a join: Evaluation -> Submission -> Question -> Paper -> Course
    # To keep it simple, fetch all requiring review and filter in python, or just return all if admin, but faculty must be scoped.
    # We will assume faculty can review all flagged evaluations for their students.
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.course_id.in_(course_ids)).all()
    student_ids = list(set([e.student_id for e in enrollments]))
    
    from app.db.models import AnswerSubmission
    evals = db.query(AnswerEvaluation).join(AnswerSubmission).filter(
        AnswerEvaluation.requires_human_review == True,
        AnswerSubmission.user_id.in_(student_ids) if student_ids else False
    ).all()
    
    return [
        {
            "evaluation_id": e.id,
            "submission_id": e.submission_id,
            "obtained_marks": e.obtained_marks,
            "confidence_score": e.confidence_score,
            "feedback": e.feedback
        } for e in evals
    ]

@router.put("/evaluations/{eval_id}/override")
def override_evaluation(eval_id: int, req: OverrideRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_faculty)):
    evaluation = db.query(AnswerEvaluation).filter(AnswerEvaluation.id == eval_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    # Authorization check
    # Ensure this evaluation belongs to a student this faculty can access
    # This fulfills "Faculty A cannot access students, evaluations or courses belonging to Faculty B"
    faculty_courses = db.query(CourseFacultyMap.course_id).filter(CourseFacultyMap.faculty_id == current_user.id).all()
    course_ids = [c[0] for c in faculty_courses]
    
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.course_id.in_(course_ids)).all()
    student_ids = list(set([e.student_id for e in enrollments]))
    
    from app.db.models import AnswerSubmission
    submission = db.query(AnswerSubmission).filter(AnswerSubmission.id == evaluation.submission_id).first()
    
    if submission.user_id not in student_ids and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to access this student's evaluations")
        
    # Validate marks
    # We need the max_marks from the question
    from app.db.models import Question, MockPaperQuestion
    max_marks = 10.0 # Default fallback
    if submission.historical_question_id:
        q = db.query(Question).filter(Question.id == submission.historical_question_id).first()
        if q: max_marks = q.marks
    elif submission.mock_question_id:
        q = db.query(MockPaperQuestion).filter(MockPaperQuestion.id == submission.mock_question_id).first()
        if q: max_marks = q.marks
        
    if not (0 <= req.final_marks <= max_marks):
        raise HTTPException(status_code=400, detail=f"Final marks must be between 0 and {max_marks}")
        
    # Apply override
    evaluation.original_obtained_marks = evaluation.obtained_marks
    evaluation.obtained_marks = req.final_marks
    evaluation.overridden_by = current_user.id
    evaluation.overridden_at = datetime.utcnow()
    evaluation.override_reason = req.override_reason
    evaluation.requires_human_review = False # Resolved
    
    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="EVALUATION_OVERRIDE",
        details=f"Overrode eval_id={eval_id} from {evaluation.original_obtained_marks} to {req.final_marks}. Reason: {req.override_reason}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Override successful", "new_marks": evaluation.obtained_marks}
