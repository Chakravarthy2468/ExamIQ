import sqlite3

def check_db():
    conn = sqlite3.connect("backend/examiq.db")
    cursor = conn.cursor()

    print("--- Documents ---")
    cursor.execute("SELECT id, course_id, type, file_name FROM documents")
    docs = cursor.fetchall()
    for doc in docs:
        print(doc)

    print("\n--- Questions Extracted ---")
    cursor.execute("SELECT id, paper_id, question_number, question_text FROM questions")
    questions = cursor.fetchall()
    if not questions:
        print("NO QUESTIONS FOUND!")
    else:
        for q in questions[:10]:
            print(q)
        print(f"Total questions: {len(questions)}")
        
    print("\n--- Mock Paper Questions ---")
    cursor.execute("SELECT id, mock_paper_id, historical_question_id, question_text FROM mock_paper_questions")
    mqs = cursor.fetchall()
    if not mqs:
        print("NO MOCK QUESTIONS FOUND!")
    else:
        for mq in mqs[:5]:
            print(mq)

    print("\n--- Study Plans ---")
    cursor.execute("SELECT id, course_id, schedule_data FROM study_plans")
    plans = cursor.fetchall()
    if not plans:
        print("NO STUDY PLANS FOUND!")
    else:
        for p in plans[:1]:
            print(p[0], p[1], p[2][:100] + "...")

    conn.close()

if __name__ == "__main__":
    check_db()
