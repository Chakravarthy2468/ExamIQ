import pytest
from app.db.models import TopicAnalytics, Topic, Unit, Course

def test_compute_analytics_empty(client):
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "analytics@example.com", "password": "password123", "full_name": "Analytics User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "analytics@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Compute analytics for non-existent course
    response = client.post(
        "/api/v1/analytics/compute/999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    
    # Dashboard should show 0 coverage
    dash_response = client.get(
        "/api/v1/analytics/dashboard/999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert dash_response.status_code == 200
    data = dash_response.json()
    assert data["coverage"] == 0.0
    assert "disclaimer" in data
