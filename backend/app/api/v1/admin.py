import os
import requests
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
from app.db.database import get_db, engine
from app.db.models import User, AuditLog, RoleEnum
from app.api.dependencies import get_current_admin
from pydantic import BaseModel

router = APIRouter()

class RoleUpdateReq(BaseModel):
    role: str

@router.get("/health")
def health_check(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    health_status = {
        "application": "UP",
        "database": "UNKNOWN",
        "ollama": "UNKNOWN",
        "model": os.getenv("OLLAMA_MODEL", "qwen3:8b")
    }
    
    # Check DB
    try:
        db.execute(text("SELECT 1"))
        health_status["database"] = "UP"
    except Exception:
        health_status["database"] = "DOWN"
        
    # Check Ollama
    try:
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        resp = requests.get(f"{base_url}/api/tags", timeout=3)
        if resp.status_code == 200:
            health_status["ollama"] = "UP"
        else:
            health_status["ollama"] = "DEGRADED"
    except Exception:
        health_status["ollama"] = "DOWN"
        
    return health_status

@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "role": u.role} for u in users]

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, req: RoleUpdateReq, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    if req.role not in [RoleEnum.STUDENT, RoleEnum.FACULTY, RoleEnum.ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = req.role
    
    audit = AuditLog(
        user_id=current_user.id,
        action="ROLE_UPDATE",
        details=f"Updated user_id={user_id} to role {req.role}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": f"User {user_id} role updated to {req.role}"}

@router.get("/audit_logs")
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "details": l.details,
            "timestamp": l.timestamp
        } for l in logs
    ]
