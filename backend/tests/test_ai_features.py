import pytest
from app.db.models import Question, MockPaperQuestion, AnswerSubmission

def test_ask_ai_tutor(client):
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "ai_tutor@example.com", "password": "password123", "full_name": "Tutor User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "ai_tutor@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.post(
        "/api/v1/ai_tutor/ask",
        json={"prompt": "Explain Software Development Life Cycle"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "response" in data

def test_evaluate_answer(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={"email": "evaluate@example.com", "password": "password123", "full_name": "Evaluate User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "evaluate@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # We need a dummy historical question in DB
    q = Question(
        paper_id=1,
        question_text="What is SDLC?",
        marks=10.0
    )
    db_session.add(q)
    db_session.commit()
    
    response = client.post(
        "/api/v1/evaluations/submit",
        json={
            "historical_question_id": q.id,
            "text_content": "This is a dummy student answer."
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "evaluation" in data
    eval_data = data["evaluation"]
    assert "obtained_marks" in eval_data
    assert "feedback" in eval_data
    assert "confidence_score" in eval_data
