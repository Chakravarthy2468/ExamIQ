import re
from sqlalchemy.orm import Session
from app.db.models import Document, QuestionPaper, Question

def extract_questions_from_text(db: Session, doc: Document, text: str):
    """
    Very basic heuristic-based question extractor.
    In a real ML setting, this would use a sequence labeler or more robust NLP.
    """
    # Create QuestionPaper record
    paper = QuestionPaper(document_id=doc.id)
    # Could try to extract year/marks from text here
    db.add(paper)
    db.commit()
    db.refresh(paper)
    
    # Split text into lines, look for patterns like "1. ", "Q1.", "1a)"
    lines = text.split('\n')
    current_q_text = []
    current_q_num = None
    
    question_pattern = re.compile(r'^(Q?\d+[a-zA-Z]?[\.\)]\s+)(.*)', re.IGNORECASE)
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        match = question_pattern.match(line)
        if match:
            # We found a new question, save the old one
            if current_q_num and current_q_text:
                save_question(db, paper.id, current_q_num, "\n".join(current_q_text))
                
            current_q_num = match.group(1).strip()
            current_q_text = [match.group(2)]
        else:
            if current_q_num:
                current_q_text.append(line)
                
    # Save the last one
    if current_q_num and current_q_text:
        save_question(db, paper.id, current_q_num, "\n".join(current_q_text))

def save_question(db: Session, paper_id: int, q_num: str, q_text: str):
    # Try to extract marks if pattern like "[10]" or "(5 marks)" is at the end
    marks = None
    marks_pattern = re.search(r'\[(\d+)(?:\s*marks?)?\]|\((\d+)(?:\s*marks?)?\)', q_text, re.IGNORECASE)
    if marks_pattern:
        val = marks_pattern.group(1) or marks_pattern.group(2)
        try:
            marks = float(val)
        except:
            pass
            
    q = Question(
        paper_id=paper_id,
        question_number=q_num,
        question_text=q_text,
        marks=marks
    )
    db.add(q)
    db.commit()
