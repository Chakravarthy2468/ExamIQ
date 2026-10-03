import requests
import time
import os

BASE_URL = "http://localhost:8000/api/v1"

def test_flows():
    print("--- Starting Detailed Smoke Test ---")
    
    # 1. Register/Login to get Token
    email = "teststudent_smoke@example.com"
    password = "password123"
    
    print("Registering new user...")
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Smoke Test Student",
        "role": "STUDENT"
    })
    
    print("Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": password
    })
    
    if res.status_code != 200:
        print("Login failed:", res.text)
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Upload Syllabus Document
    print("Uploading SE Syllabus Document...")
    syllabus_path = r"C:\Users\Chakku\Downloads\SE PYQs and Syllabus\BCSE301L_SOFTWARE-ENGINEERING_TH_1.0_67_BCSE301L.pdf"
    with open(syllabus_path, 'rb') as f:
        files = {'file': ('Syllabus.pdf', f, 'application/pdf')}
        data = {'doc_type': 'SYLLABUS', 'course_name': 'Software Engineering 2026'}
        res = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files, data=data)
        doc_id_syl = res.json()["document_id"]
        print(f"Upload successful. Document ID: {doc_id_syl}")

    print("Waiting for syllabus processing (This might take a minute due to Ollama AI)...")
    for _ in range(60):
        res = requests.get(f"{BASE_URL}/documents/{doc_id_syl}/status", headers=headers)
        status = res.json().get("status")
        print(f"Status: {status}")
        if status == "COMPLETED" or status == "FAILED":
            break
        time.sleep(2)

    # 3. Upload Document (Software Engg PYQ) to trigger AI Extraction
    print("Uploading SE PYQ Document...")
    pdf_path = r"C:\Users\Chakku\Downloads\SE PYQs and Syllabus\198831_43293b48a7514d40b015f02bc8f2021a.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Error: Could not find PDF at {pdf_path}")
        return
        
    with open(pdf_path, 'rb') as f:
        files = {'file': ('SE_PYQ.pdf', f, 'application/pdf')}
        data = {'doc_type': 'QUESTION_PAPER', 'course_name': 'Software Engineering 2026'}
        res = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files, data=data)
        
    if res.status_code != 200:
        print("Upload failed:", res.text)
        return
        
    doc_id = res.json()["document_id"]
    print(f"Upload successful. Document ID: {doc_id}")

    # 4. Wait for processing (AI Extraction)
    print("Waiting for document processing (This might take a minute due to Ollama AI)...")
    for _ in range(60): # wait up to 120 seconds
        res = requests.get(f"{BASE_URL}/documents/{doc_id}/status", headers=headers)
        status = res.json().get("status")
        print(f"Status: {status}")
        if status == "COMPLETED" or status == "FAILED":
            break
        time.sleep(2)
        
    if status != "COMPLETED":
        print("Document processing did not complete successfully.")
        return
        
    # Get the course_id
    res = requests.get(f"{BASE_URL}/courses", headers=headers)
    courses = res.json()
    course_id = next(c["id"] for c in courses if c["name"] == "Software Engineering 2026")
    print(f"Found Course ID: {course_id}")

    # 4. Study Plans
    print("Testing Study Plans...")
    res = requests.post(f"{BASE_URL}/study_plans/generate/{course_id}?days=30&hours_per_day=2.0", headers=headers)
    if res.status_code != 200:
        print("Study plan generation failed:", res.text)
        return
    print("Study plan generated:", str(res.json())[:200] + "...")

    # 5. Mock Exams
    print("Testing Mock Exams...")
    res = requests.post(f"{BASE_URL}/mock_papers/generate/{course_id}", headers=headers)
    if res.status_code != 200:
        print("Mock paper generation failed:", res.text)
        return
    print("Mock paper generated:", res.json())

    # 6. Reports (PDF)
    print("Testing PDF Report Generation...")
    res = requests.post(f"{BASE_URL}/reports/generate/{course_id}/pdf", headers=headers)
    if res.status_code != 200:
        print("Report generation failed:", res.text)
        return
    report_id = res.json()["report_id"]
    print(f"Report generated successfully. ID: {report_id}")
    
    print("Testing Report Download...")
    res = requests.get(f"{BASE_URL}/reports/download/{report_id}", headers=headers)
    if res.status_code != 200:
        print("Report download failed:", res.text)
        return
    print("Report downloaded successfully. Content length:", len(res.content))

    print("--- Smoke Test Completed Successfully! ---")

if __name__ == "__main__":
    test_flows()
