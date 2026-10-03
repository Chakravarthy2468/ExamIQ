from app.db.database import SessionLocal
from app.db.models import Document
from app.services.question_extractor import extract_questions_from_text
from app.ocr.parser import parse_pdf
import traceback

def run():
    db = SessionLocal()
    # Find the latest SE PYQ document
    doc = db.query(Document).filter(Document.file_name == 'SE_PYQ.pdf').order_by(Document.id.desc()).first()
    if not doc:
        print("No document found")
        return
        
    print(f"Extracting text from {doc.file_path}")
    text = parse_pdf(doc.file_path)
    print("PDF Text excerpt:", text[:200])
    
    print("Running question extractor...")
    try:
        from app.db.models import QuestionPaper
        # Delete existing paper if any
        existing = db.query(QuestionPaper).filter(QuestionPaper.document_id == doc.id).first()
        if existing:
            db.delete(existing)
            db.commit()
            
        extract_questions_from_text(db, doc, text)
        print("Success without exceptions in caller")
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    run()
