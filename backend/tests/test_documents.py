import pytest
import os
from fastapi.testclient import TestClient

def test_document_upload(client):
    # First register and login to get token
    client.post(
        "/api/v1/auth/register",
        json={"email": "doc@example.com", "password": "password123", "full_name": "Doc User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "doc@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Create a dummy pdf file for testing
    dummy_file_path = "test_dummy.pdf"
    with open(dummy_file_path, "wb") as f:
        f.write(b"%PDF-1.4 dummy content")
        
    with open(dummy_file_path, "rb") as f:
        response = client.post(
            "/api/v1/documents/upload",
            headers={"Authorization": f"Bearer {token}"},
            data={"doc_type": "QUESTION_PAPER", "course_id": 1},
            files={"file": ("test_dummy.pdf", f, "application/pdf")}
        )
        
    os.remove(dummy_file_path)
    
    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    
    doc_id = data["document_id"]
    status_response = client.get(
        f"/api/v1/documents/{doc_id}/status",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert status_response.status_code == 200
    assert "status" in status_response.json()
