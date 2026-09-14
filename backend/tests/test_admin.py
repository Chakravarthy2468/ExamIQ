import pytest
from app.db.models import User, RoleEnum

def test_admin_rbac(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={"email": "admin_test@example.com", "password": "password123", "full_name": "Student User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test@example.com", "password": "password123"}
    )
    student_token = login_response.json()["access_token"]
    
    response = client.get("/api/v1/admin/health", headers={"Authorization": f"Bearer {student_token}"})
    assert response.status_code == 403

def test_admin_health(client, db_session):
    # Setup Admin
    admin = User(email="admin_user@ex.com", password_hash="pw", role=RoleEnum.ADMIN, full_name="A1")
    db_session.add(admin)
    db_session.commit()
    
    from app.core.security import create_access_token
    from datetime import timedelta
    admin_token = create_access_token(admin.id, admin.role.value, expires_delta=timedelta(minutes=60))
    
    response = client.get("/api/v1/admin/health", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "application" in data
    assert "database" in data
    assert "ollama" in data
    assert data["database"] == "UP"
