import requests
import time
import os

BASE_URL = "http://localhost:8000/api/v1"

# 1. Login as student
res = requests.post(f"{BASE_URL}/auth/login", data={"username": "student@examiq.com", "password": "student123"})
if res.status_code != 200:
    print("Login failed:", res.text)
    exit(1)
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get Course ID
res = requests.get(f"{BASE_URL}/courses", headers=headers)
courses = res.json()
se_course = next((c for c in courses if "Software Engineering" in c["name"]), None)
if not se_course:
    print("Software Engineering course not found!")
    exit(1)
course_id = se_course["id"]
print(f"Using Course ID: {course_id} ({se_course['name']})")

# 3. Generate Mock Paper
res = requests.post(f"{BASE_URL}/mock_papers/generate/{course_id}?difficulty=MEDIUM&total_marks=50", headers=headers)
print("Generate Mock Paper:", res.json())
if res.status_code == 200:
    paper_id = res.json()["paper_id"]
    
    # 4. Fetch Mock Paper
    res = requests.get(f"{BASE_URL}/mock_papers/{paper_id}", headers=headers)
    print("Mock Paper Details:")
    data = res.json()
    for i, q in enumerate(data.get("questions", [])):
        print(f"Q{i+1}: {q['text'][:50]}... ({q['marks']} marks)")
