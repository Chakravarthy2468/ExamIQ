import requests
import time
import os
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def test_flows():
    print("--- Starting Detailed Smoke Test (Multiple PYQs) ---")
    
    # 1. Register/Login to get Token
    email = f"teststudent_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    course_name = f"Software Engineering MultiPYQ {uuid.uuid4().hex[:4]}"
    
    print("Registering new user...")
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Smoke Test Student Multi",
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
    print(f"Uploading SE Syllabus Document for {course_name}...")
    syllabus_path = r"C:\Users\Chakku\Downloads\SE PYQs and Syllabus\BCSE301L_SOFTWARE-ENGINEERING_TH_1.0_67_BCSE301L.pdf"
    with open(syllabus_path, 'rb') as f:
        files = {'file': ('Syllabus.pdf', f, 'application/pdf')}
        data = {'doc_type': 'SYLLABUS', 'course_name': course_name}
        res = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files, data=data)
        doc_id_syl = res.json()["document_id"]
        print(f"Upload successful. Syllabus Document ID: {doc_id_syl}")

    # 3. Upload Multiple PYQs
    pyq_paths = [
        r"C:\Users\Chakku\Downloads\SE PYQs and Syllabus\198831_43293b48a7514d40b015f02bc8f2021a.pdf",
        r"C:\Users\Chakku\Downloads\SE PYQs and Syllabus\5ba521_f5d7b6a2117641a8a2d97fd7d4e4d0fb.pdf"
    ]
    pyq_doc_ids = []
    
    for idx, pdf_path in enumerate(pyq_paths):
        print(f"Uploading SE PYQ Document #{idx+1}...")
        if not os.path.exists(pdf_path):
            print(f"Error: Could not find PDF at {pdf_path}")
            continue
            
        with open(pdf_path, 'rb') as f:
            files = {'file': (f'SE_PYQ_{idx+1}.pdf', f, 'application/pdf')}
            data = {'doc_type': 'QUESTION_PAPER', 'course_name': course_name}
            res = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files, data=data)
            
        if res.status_code != 200:
            print("Upload failed:", res.text)
            continue
            
        doc_id = res.json()["document_id"]
        pyq_doc_ids.append(doc_id)
        print(f"Upload successful. PYQ Document ID: {doc_id}")

    # 4. Wait for processing (AI Extraction)
    all_doc_ids = [doc_id_syl] + pyq_doc_ids
    print(f"Waiting for processing of {len(all_doc_ids)} documents...")
    
    for doc_id in all_doc_ids:
        print(f"Monitoring Document {doc_id}...")
        for _ in range(60): # wait up to 120 seconds per doc
            res = requests.get(f"{BASE_URL}/documents/{doc_id}/status", headers=headers)
            status = res.json().get("status")
            print(f"Doc {doc_id} Status: {status}")
            if status == "COMPLETED" or status == "FAILED":
                break
            time.sleep(2)
            
        if status != "COMPLETED":
            print(f"Document {doc_id} processing did not complete successfully.")
            
    # Get the course_id
    res = requests.get(f"{BASE_URL}/courses", headers=headers)
    courses = res.json()
    course_id = next(c["id"] for c in courses if c["name"] == course_name)
    print(f"Found Course ID: {course_id}")

    # 5. Study Plans
    print("Testing Study Plans...")
    res = requests.post(f"{BASE_URL}/study_plans/generate/{course_id}?days=30&hours_per_day=2.0", headers=headers)
    if res.status_code != 200:
        print("Study plan generation failed:", res.text)
        return
    print("Study plan generated successfully. Sample:", str(res.json())[:200] + "...")

    # 6. Mock Exams
    print("Testing Mock Exams...")
    res = requests.post(f"{BASE_URL}/mock_papers/generate/{course_id}", headers=headers)
    if res.status_code != 200:
        print("Mock paper generation failed:", res.text)
        return
    print("Mock paper generated successfully.")

    # 7. Reports (PDF)
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
