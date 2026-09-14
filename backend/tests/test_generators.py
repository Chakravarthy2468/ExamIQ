import pytest
from app.db.models import StudyPlan, MockPaper

def test_generate_study_plan(client):
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "student@example.com", "password": "password123", "full_name": "Student User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "student@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.post(
        "/api/v1/study_plans/generate/1?days=30&hours_per_day=2.0",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "plan_id" in data
    assert "schedule" in data

def test_generate_mock_paper(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "student_mock@example.com", "password": "password123", "full_name": "Student Mock User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "student_mock@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.post(
        "/api/v1/mock_papers/generate/1?difficulty=MEDIUM&total_marks=50",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "paper_id" in data
