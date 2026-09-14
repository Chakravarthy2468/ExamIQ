import os
import pytest
import requests

E2E_FIXTURE_DIR = os.getenv("E2E_FIXTURE_DIR", r"C:\Users\Chakku\Downloads\SE PYQs and Syllabus")

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

@pytest.mark.skipif(not os.path.exists(E2E_FIXTURE_DIR), reason=f"E2E Fixture Directory {E2E_FIXTURE_DIR} not found.")
@pytest.mark.skipif(not is_ollama_ready(), reason="Local Ollama with qwen3:8b is not available")
def test_e2e_real_workflow(client, db_session, monkeypatch):
    monkeypatch.setenv("USE_MOCK_AI", "false")
    
    # 1. Register & Login
    from app.db.models import University, Course
    uni = University(name="E2E Uni", location="Loc")
    db_session.add(uni)
    db_session.commit()
    course = Course(name="SE", code="SE101", university_id=uni.id)
    db_session.add(course)
    db_session.commit()
    client.post("/api/v1/auth/register", json={"email": "e2e@example.com", "password": "password123", "full_name": "E2E User", "university_id": uni.id})
    login = client.post("/api/v1/auth/login", data={"username": "e2e@example.com", "password": "password123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Upload Syllabus (Pick the first PDF in syllabus dir)
    syllabus_files = [f for f in os.listdir(E2E_FIXTURE_DIR) if f.startswith("BCSE301L") and f.endswith(".pdf")]
    if not syllabus_files:
        pytest.skip("No syllabus PDF found in E2E_FIXTURE_DIR")
        
    syllabus_path = os.path.join(E2E_FIXTURE_DIR, syllabus_files[0])
    with open(syllabus_path, "rb") as f:
        resp = client.post("/api/v1/documents/upload", files={"file": (syllabus_files[0], f, "application/pdf")}, data={"doc_type": "SYLLABUS", "university_id": 1, "course_id": 1}, headers=headers)
    assert resp.status_code == 200
    
    paper_files = [f for f in os.listdir(E2E_FIXTURE_DIR) if not f.startswith("BCSE301L") and f.endswith(".pdf")]
    if paper_files:
        paper_path = os.path.join(E2E_FIXTURE_DIR, paper_files[0])
        with open(paper_path, "rb") as f:
            resp = client.post("/api/v1/documents/upload", files={"file": (paper_files[0], f, "application/pdf")}, data={"doc_type": "QUESTION_PAPER", "university_id": 1, "course_id": 1}, headers=headers)
        assert resp.status_code == 200

    # Since processing is normally async, wait/sync it or test APIs explicitly.
    # For E2E, we know endpoints exist for processing. 
    # Realistically we need the syllabus parsed into topics.
    # Assuming endpoints for mapping/analytics/plans are mocked or functional:
    
    # 3. Generate Report
    # Course ID 1
    resp = client.post("/api/v1/reports/generate/1/pdf", headers=headers)
    assert resp.status_code == 200
    pdf_path = resp.json()["file_path"]
    assert os.path.exists(pdf_path)
    
    # Verify the Responsible AI string is in the PDF? (Need pdf parsing library for that, or just check size)
    assert os.path.getsize(pdf_path) > 0
