import re
from sqlalchemy.orm import Session
from app.db.models import Document, QuestionPaper, Question

def extract_questions_from_text(db: Session, doc: Document, text: str):
    """
    Very basic heuristic-based question extractor.
    In a real ML setting, this would use a sequence labeler or more robust NLP.
    """
    # Create QuestionPaper record if not exists
    paper = db.query(QuestionPaper).filter(QuestionPaper.document_id == doc.id).first()
    if not paper:
        paper = QuestionPaper(document_id=doc.id)
        db.add(paper)
        db.commit()
        db.refresh(paper)
    
    # Split text into lines, look for patterns like "1. ", "Q1.", "1a)"
    # We will use AI to extract questions robustly
    from app.nlp.ai_provider import get_ai_provider
    import json
    import logging
    
    logger = logging.getLogger(__name__)
    ai = get_ai_provider()
    
    system_prompt = """
    You are an expert at extracting exam questions from text.
    Given the raw text of a past year question paper, extract all the distinct questions.
    Return the output as a JSON array of objects.
    Each object must have the following keys:
    - "question_number": string (e.g. "Q1", "1a", "2", or just a sequential number if not numbered)
    - "question_text": string (the full text of the question)
    - "marks": number (the marks allocated to the question, or null if not found)
    Do not include any other text or markdown outside the JSON array.
    """
    
    prompt = f"Raw Exam Text:\n{text}"
    
    try:
        response_str = ai.generate_response(prompt, system_prompt=system_prompt, json_format=True)
        if response_str.startswith("```json"):
            response_str = response_str.strip("```json").strip("```").strip()
            
        questions_data = json.loads(response_str)
        
        # In case the LLM returned a dict instead of an array
        if isinstance(questions_data, dict):
            # Try to find the array
            for k, v in questions_data.items():
                if isinstance(v, list):
                    questions_data = v
                    break
            else:
                questions_data = [questions_data]
                
        for i, q_data in enumerate(questions_data):
            q_num = str(q_data.get("question_number", f"Q{i+1}"))
            q_text = str(q_data.get("question_text", ""))
            marks_val = q_data.get("marks")
            marks = float(marks_val) if marks_val is not None else None
            
            if q_text:
                q = Question(
                    paper_id=paper.id,
                    question_number=q_num,
                    question_text=q_text,
                    marks=marks
                )
                db.add(q)
                
        db.commit()
    except Exception as e:
        logger.error(f"AI Question Extraction failed: {e}")
        # Fallback to a basic heuristic extractor
        
        # Look for patterns like "1. ", "Q1.", "1a)" OR keywords like "Explain", "What", "Suggest"
        question_pattern = re.compile(r'^(?:Q?\d+[a-zA-Z]?[\.\)\-]\s+)?(?:Explain|What|How|Why|Describe|Discuss|Suggest|Write|List|Define)(.*)', re.IGNORECASE)
        
        lines = text.split('\n')
        current_q_text = []
        current_q_num = None
        q_counter = 1
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            match = question_pattern.match(line)
            # Also fallback to general numbered lists if they don't start with keywords
            number_match = re.compile(r'^(Q?\d+[a-zA-Z]?[\.\)\-])\s+(.*)', re.IGNORECASE).match(line)
            
            if match or number_match:
                if current_q_text:
                    q_num = current_q_num if current_q_num else f"Q{q_counter}"
                    q = Question(paper_id=paper.id, question_number=q_num, question_text="\n".join(current_q_text), marks=10.0)
                    db.add(q)
                    q_counter += 1
                    
                if number_match:
                    current_q_num = number_match.group(1).strip()
                    current_q_text = [number_match.group(2)]
                else:
                    current_q_num = None
                    current_q_text = [line]
            else:
                if current_q_text:
                    current_q_text.append(line)
                    
        if current_q_text:
            q_num = current_q_num if current_q_num else f"Q{q_counter}"
            q = Question(paper_id=paper.id, question_number=q_num, question_text="\n".join(current_q_text), marks=10.0)
            db.add(q)
            
        db.commit()
