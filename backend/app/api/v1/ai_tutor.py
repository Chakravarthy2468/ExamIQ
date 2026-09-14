from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.api.dependencies import get_current_user
from app.services.ai_tutor import generate_tutor_response
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class TutorRequest(BaseModel):
    prompt: str
    topic_id: Optional[int] = None

@router.post("/ask")
def ask_tutor(req: TutorRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
    session = generate_tutor_response(db, current_user.id, req.prompt, req.topic_id)
    
    return {
        "session_id": session.id,
        "response": session.response
    }
