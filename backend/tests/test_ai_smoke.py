import os
import pytest
import requests
from app.db.models import Question

# Check if Ollama is running and qwen3:8b is available
def is_ollama_ready():
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "qwen3:8b")
    try:
        resp = requests.get(f"{base_url}/api/tags", timeout=5)
        if resp.status_code == 200:
            models = [m.get("name") for m in resp.json().get("models", [])]
            return model in models
    except Exception:
        pass
    return False

@pytest.mark.skipif(not is_ollama_ready(), reason="Local Ollama with qwen3:8b is not available")
def test_real_ollama_answer_evaluation(client, db_session, monkeypatch):
    # Force the app to use the real AI provider
    monkeypatch.setenv("USE_MOCK_AI", "false")
    
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "ollama_smoke@example.com", "password": "password123", "full_name": "Ollama Smoke"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "ollama_smoke@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Create a real historical question
    q = Question(
        paper_id=1,
        question_text="Describe the four main phases of the Software Development Life Cycle (SDLC).",
        marks=10.0
    )
    db_session.add(q)
    db_session.commit()
    
    # Send a real answer to evaluate
    response = client.post(
        "/api/v1/evaluations/submit",
        json={
            "historical_question_id": q.id,
            "text_content": "The SDLC phases are Planning, Analysis, Design, and Implementation. Planning is about gathering requirements, Analysis is about understanding them, Design is about architecting the software, and Implementation is writing the code."
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "evaluation" in data
    
    eval_data = data["evaluation"]
    
    # Validations requested by the user
    assert "obtained_marks" in eval_data
    assert isinstance(eval_data["obtained_marks"], (int, float))
    assert 0.0 <= eval_data["obtained_marks"] <= 10.0 # Validated against max_marks
    
    assert "confidence_score" in eval_data
    assert isinstance(eval_data["confidence_score"], (int, float))
    assert 0.0 <= eval_data["confidence_score"] <= 1.0
    
    assert "requires_human_review" in eval_data
    assert isinstance(eval_data["requires_human_review"], bool)
    
    assert "completeness" in eval_data
    assert "missing_concepts" in eval_data
    assert "feedback" in eval_data
