import pytest
from app.db.models import User, RoleEnum, Course, University, CourseFacultyMap, CourseEnrollment, AnswerSubmission, AnswerEvaluation, Question
from datetime import datetime

def test_faculty_rbac(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={"email": "student@example.com", "password": "password123", "full_name": "Student User"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "student@example.com", "password": "password123"}
    )
    student_token = login_response.json()["access_token"]
    
    # Try accessing faculty endpoint as student
    response = client.get("/api/v1/faculty/students", headers={"Authorization": f"Bearer {student_token}"})
    assert response.status_code == 403
    
def test_faculty_override(client, db_session):
    # Setup users
    student = User(email="f_student@ex.com", password_hash="pw", role=RoleEnum.STUDENT, full_name="S1")
    faculty1 = User(email="f_fac1@ex.com", password_hash="pw", role=RoleEnum.FACULTY, full_name="F1")
    faculty2 = User(email="f_fac2@ex.com", password_hash="pw", role=RoleEnum.FACULTY, full_name="F2")
    db_session.add_all([student, faculty1, faculty2])
    db_session.commit()
    
    # Setup Course
    u = University(name="Override Uni")
    db_session.add(u)
    db_session.commit()
    
    c = Course(university_id=u.id, name="Override Course", code="OC101", semester=1)
    db_session.add(c)
    db_session.commit()
    
    # Faculty1 manages Course, Student is enrolled
    db_session.add(CourseFacultyMap(course_id=c.id, faculty_id=faculty1.id))
    db_session.add(CourseEnrollment(course_id=c.id, student_id=student.id))
    
    # Setup Evaluation
    q = Question(paper_id=1, question_text="What?", marks=10.0)
    db_session.add(q)
    db_session.commit()
    
    sub = AnswerSubmission(user_id=student.id, historical_question_id=q.id, file_path="dummy.pdf")
    db_session.add(sub)
    db_session.commit()
    
    ev = AnswerEvaluation(submission_id=sub.id, obtained_marks=5.0, completeness=0.5, missing_concepts="", feedback="", requires_human_review=True)
    db_session.add(ev)
    db_session.commit()
    
    # Login Faculty1 and Faculty2
    from app.core.security import create_access_token
    from datetime import timedelta
    f1_token = create_access_token(faculty1.id, faculty1.role.value, expires_delta=timedelta(minutes=60))
    f2_token = create_access_token(faculty2.id, faculty2.role.value, expires_delta=timedelta(minutes=60))
    
    # Faculty 2 (Not mapped) tries to override
    response = client.put(f"/api/v1/faculty/evaluations/{ev.id}/override", json={"final_marks": 9.0, "override_reason": "Better"}, headers={"Authorization": f"Bearer {f2_token}"})
    assert response.status_code == 403
    
    # Faculty 1 tries to over-mark
    response = client.put(f"/api/v1/faculty/evaluations/{ev.id}/override", json={"final_marks": 11.0, "override_reason": "Extra"}, headers={"Authorization": f"Bearer {f1_token}"})
    assert response.status_code == 400
    
    # Faculty 1 correct override
    response = client.put(f"/api/v1/faculty/evaluations/{ev.id}/override", json={"final_marks": 8.0, "override_reason": "Good"}, headers={"Authorization": f"Bearer {f1_token}"})
    assert response.status_code == 200
    assert response.json()["new_marks"] == 8.0
    
    db_session.refresh(ev)
    assert ev.original_obtained_marks == 5.0
    assert ev.obtained_marks == 8.0
    assert ev.overridden_by == faculty1.id
    assert ev.override_reason == "Good"
    assert ev.requires_human_review == False
