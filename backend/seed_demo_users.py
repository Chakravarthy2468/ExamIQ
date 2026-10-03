import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.db.models import User, RoleEnum, University, Course, CourseFacultyMap
from app.core.security import get_password_hash

def seed_demo_users():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Create a university if none exists
        uni = db.query(University).filter(University.name == "Demo University").first()
        if not uni:
            uni = University(name="Demo University", location="Local")
            db.add(uni)
            db.commit()
            db.refresh(uni)

        # Create a course
        course = db.query(Course).filter(Course.code == "CS101").first()
        if not course:
            course = Course(name="Intro to CS", code="CS101", university_id=uni.id)
            db.add(course)
            db.commit()
            db.refresh(course)

        # Create Admin
        admin = db.query(User).filter(User.email == "admin@examiq.com").first()
        if not admin:
            admin = User(
                email="admin@examiq.com",
                password_hash=get_password_hash("admin123"),
                full_name="System Admin",
                role=RoleEnum.ADMIN,
                university_id=uni.id
            )
            db.add(admin)

        # Create Faculty
        faculty = db.query(User).filter(User.email == "faculty@examiq.com").first()
        if not faculty:
            faculty = User(
                email="faculty@examiq.com",
                password_hash=get_password_hash("faculty123"),
                full_name="Professor Smith",
                role=RoleEnum.FACULTY,
                university_id=uni.id
            )
            db.add(faculty)
            db.commit()
            db.refresh(faculty)
            # Map faculty to course
            mapping = db.query(CourseFacultyMap).filter(CourseFacultyMap.faculty_id == faculty.id, CourseFacultyMap.course_id == course.id).first()
            if not mapping:
                db.add(CourseFacultyMap(faculty_id=faculty.id, course_id=course.id))

        # Create Student
        student = db.query(User).filter(User.email == "student@examiq.com").first()
        if not student:
            student = User(
                email="student@examiq.com",
                password_hash=get_password_hash("student123"),
                full_name="Alice Student",
                role=RoleEnum.STUDENT,
                university_id=uni.id
            )
            db.add(student)

        db.commit()
        print("Demo users seeded successfully!")

    except Exception as e:
        print(f"Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_users()
