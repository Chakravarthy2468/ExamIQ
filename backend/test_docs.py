import requests
import time
import os

BASE_URL = "http://localhost:8000/api/v1"
DIR = r"c:\Users\Chakku\Downloads\SE PYQs and Syllabus"

# 1. Login as student
res = requests.post(f"{BASE_URL}/auth/login", data={"username": "student@examiq.com", "password": "student123"})
if res.status_code != 200:
    print("Login failed:", res.text)
    exit(1)
    
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Upload Syllabus
syllabus_path = os.path.join(DIR, "BCSE301L_SOFTWARE-ENGINEERING_TH_1.0_67_BCSE301L.pdf")
print("Uploading Syllabus...")
with open(syllabus_path, 'rb') as f:
    res = requests.post(
        f"{BASE_URL}/documents/upload", 
        headers=headers,
        data={"doc_type": "SYLLABUS", "course_name": "Software Engineering"},
        files={"file": ("syllabus.pdf", f, "application/pdf")}
    )
print("Syllabus upload response:", res.json())
doc_id_1 = res.json().get("document_id")

# 3. Upload PYQ
pyq_path = os.path.join(DIR, "198831_43293b48a7514d40b015f02bc8f2021a.pdf")
print("Uploading PYQ...")
with open(pyq_path, 'rb') as f:
    res = requests.post(
        f"{BASE_URL}/documents/upload", 
        headers=headers,
        data={"doc_type": "QUESTION_PAPER", "course_name": "Software Engineering"},
        files={"file": ("pyq.pdf", f, "application/pdf")}
    )
print("PYQ upload response:", res.json())
doc_id_2 = res.json().get("document_id")

# 4. Check Status
if doc_id_1 and doc_id_2:
    for i in range(20):
        time.sleep(3)
        st1 = requests.get(f"{BASE_URL}/documents/{doc_id_1}/status", headers=headers).json()
        st2 = requests.get(f"{BASE_URL}/documents/{doc_id_2}/status", headers=headers).json()
        print(f"Syllabus: {st1.get('status')} ({st1.get('progress')}%), PYQ: {st2.get('status')} ({st2.get('progress')}%)")
        if st1.get("status") in ["COMPLETED", "FAILED"] and st2.get("status") in ["COMPLETED", "FAILED"]:
            print("Processing finished.")
            if st1.get("status") == "FAILED": print("Syllabus Error:", st1.get("error"))
            if st2.get("status") == "FAILED": print("PYQ Error:", st2.get("error"))
            break
