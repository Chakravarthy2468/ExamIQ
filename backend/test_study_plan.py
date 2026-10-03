from app.db.database import SessionLocal
from app.services.study_planner import generate_study_plan

db = SessionLocal()
# using course_id 3, user 1 based on previous tests
try:
    plan = generate_study_plan(db, 1, 3, 30, 2.0)
    print("Success", plan.schedule_data)
except Exception as e:
    import traceback
    traceback.print_exc()
