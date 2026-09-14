from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, AnswerSubmission
from app.api.dependencies import get_current_user
from app.services.answer_evaluation import evaluate_answer
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class SubmissionRequest(BaseModel):
    historical_question_id: Optional[int] = None
    mock_question_id: Optional[int] = None
    file_path: Optional[str] = None
    text_content: Optional[str] = None # For simulation if text is directly passed

@router.post("/submit")
def submit_and_evaluate_answer(req: SubmissionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not req.historical_question_id and not req.mock_question_id:
        raise HTTPException(status_code=400, detail="Must provide either historical_question_id or mock_question_id")
    if req.historical_question_id and req.mock_question_id:
        raise HTTPException(status_code=400, detail="Cannot provide both historical and mock question ids")
        
    submission = AnswerSubmission(
        user_id=current_user.id,
        historical_question_id=req.historical_question_id,
        mock_question_id=req.mock_question_id,
        file_path=req.file_path or "simulated_path.txt"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Evaluate
    evaluation = evaluate_answer(db, submission.id)
    
    return {
        "submission_id": submission.id,
        "evaluation": {
            "obtained_marks": evaluation.obtained_marks,
            "completeness": evaluation.completeness,
            "missing_concepts": evaluation.missing_concepts,
            "feedback": evaluation.feedback,
            "confidence_score": evaluation.confidence_score,
            "requires_human_review": evaluation.requires_human_review
        }
    }
