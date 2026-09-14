from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.api.dependencies import get_current_user
from app.services.progress import update_item_status
from pydantic import BaseModel

router = APIRouter()

class StatusUpdate(BaseModel):
    status: str # e.g. COMPLETED, PENDING, IN_PROGRESS

@router.put("/item/{item_id}")
def mark_item_status(item_id: int, req: StatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        item = update_item_status(db, item_id, req.status)
        return {"item_id": item.id, "new_status": item.status, "readiness_score": item.plan.readiness_score}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
