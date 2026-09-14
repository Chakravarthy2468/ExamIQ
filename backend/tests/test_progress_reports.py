import pytest
import os
from app.db.models import StudyPlan, StudyPlanItem, Course, University

def test_progress_tracking(client, db_session):
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "progress@example.com", "password": "password123", "full_name": "Progress User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "progress@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Setup Course and Plan
    u = University(name="Progress Uni")
    db_session.add(u)
    db_session.commit()
    
    c = Course(university_id=u.id, name="Progress Course", code="PC101", semester=1)
    db_session.add(c)
    db_session.commit()
    
    plan = StudyPlan(user_id=1, course_id=c.id, readiness_score=0.0)
    db_session.add(plan)
    db_session.commit()
    
    item = StudyPlanItem(plan_id=plan.id, topic_id=1, status="PENDING")
    db_session.add(item)
    db_session.commit()
    
    response = client.put(
        f"/api/v1/progress/item/{item.id}",
        json={"status": "COMPLETED"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["new_status"] == "COMPLETED"
    assert "readiness_score" in data

def test_generate_pdf_report(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={"email": "reports@example.com", "password": "password123", "full_name": "Reports User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "reports@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Setup Course
    u = University(name="Reports Uni")
    db_session.add(u)
    db_session.commit()
    
    c = Course(university_id=u.id, name="Reports Course", code="RC101", semester=1)
    db_session.add(c)
    db_session.commit()
    
    response = client.post(
        f"/api/v1/reports/generate/{c.id}/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "file_path" in data
    assert os.path.exists(data["file_path"])
