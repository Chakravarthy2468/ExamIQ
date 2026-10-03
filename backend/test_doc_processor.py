import traceback
from app.db.database import SessionLocal
from app.services.document_processor import DocumentProcessor

def run():
    db = SessionLocal()
    # document 10 is syllabus, 11 is pyq
    print("Testing processing doc 10 (Syllabus)")
    try:
        DocumentProcessor.process_document(db, 10)
    except Exception as e:
        traceback.print_exc()
        
    print("\nTesting processing doc 11 (PYQ)")
    try:
        DocumentProcessor.process_document(db, 11)
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    run()
