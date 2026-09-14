def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["role"] == "STUDENT"

def test_register_duplicate_user(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "password123", "full_name": "Test User"}
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 400

def test_login_user(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "password123", "full_name": "Login User"}
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_test_token(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "token@example.com", "password": "password123", "full_name": "Token User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "token@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.post(
        "/api/v1/auth/test-token",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "token@example.com"
