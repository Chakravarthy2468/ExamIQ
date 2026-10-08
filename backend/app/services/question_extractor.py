import re
from sqlalchemy.orm import Session
from app.db.models import Document, QuestionPaper, Question

def sanitize_question_text(text: str) -> str:
    # Remove leading question numbers like "1.", "Q1.", "1a)", "b)", "1. a)"
    text = re.sub(r'^(?:Q?\d+[a-zA-Z]?[\.\)\-]\s*)+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^[a-zA-Z][\.\)\-]\s+', '', text)
    
    # Remove marks like "[10 Marks]", "(5)", "[5 M]", "[10]", "(10M)"
    text = re.sub(r'[\[\(]\s*\d+\s*(?:M|Marks?|marks?)?\s*[\]\)]', '', text, flags=re.IGNORECASE)
    
    # Remove Bloom's taxonomy like "(L1)", "(L2)", "(L3)"
    text = re.sub(r'[\[\(]\s*L[1-6]\s*[\]\)]', '', text, flags=re.IGNORECASE)
    
    # Remove Course Outcomes like "[CO1]", "(CO2)"
    text = re.sub(r'[\[\(]\s*CO[1-6]\s*[\]\)]', '', text, flags=re.IGNORECASE)
    
    # Remove "OR" standalone lines
    text = re.sub(r'\bOR\b', '', text)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_questions_from_text(db: Session, doc: Document, text: str):
    """
    Extracts questions using AI, or falls back to regex heurstics.
    Sanitizes questions to remove artifacts.
    """
    paper = db.query(QuestionPaper).filter(QuestionPaper.document_id == doc.id).first()
    if not paper:
        paper = QuestionPaper(document_id=doc.id)
        db.add(paper)
        db.commit()
        db.refresh(paper)
    
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
    - "question_number": string (e.g. "Q1", "1a")
    - "question_text": string (the core technical question, completely stripped of any prefixes, question numbers, marks like '[10]', Bloom's taxonomy tags like '(L2)', Course Outcomes like 'CO1', or any other metadata. The output must be just the pure question sentence/paragraph).
    - "marks": number (the marks allocated to the question, or null if not found)
    Do not include any other text or markdown outside the JSON array.
    """
    
    prompt = f"Raw Exam Text:\n{text}"
    
    try:
        response_str = ai.generate_response(prompt, system_prompt=system_prompt, json_format=True)
        match = re.search(r'\[.*\]|\{.*\}', response_str, re.DOTALL)
        if match:
            response_str = match.group(0)
            
        questions_data = json.loads(response_str)
        
        if isinstance(questions_data, dict):
            for k, v in questions_data.items():
                if isinstance(v, list):
                    questions_data = v
                    break
            else:
                questions_data = [questions_data]
                
        for i, q_data in enumerate(questions_data):
            q_num = str(q_data.get("question_number", f"Q{i+1}"))
            q_text = sanitize_question_text(str(q_data.get("question_text", "")))
            marks_val = q_data.get("marks")
            marks = float(marks_val) if marks_val is not None else None
            
            if q_text and len(q_text) > 5:
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
        
        # Fallback heuristic extractor
        question_pattern = re.compile(r'^(?:Q?\d+[a-zA-Z]?[\.\)\-]\s+)?(?:Explain|What|How|Why|Describe|Discuss|Suggest|Write|List|Define)(.*)', re.IGNORECASE)
        
        lines = text.split('\n')
        current_q_text = []
        current_q_num = None
        q_counter = 1
        
        def save_heuristic_question():
            nonlocal q_counter, current_q_text, current_q_num
            if current_q_text:
                q_text = sanitize_question_text("\n".join(current_q_text))
                if len(q_text) > 10:
                    q_num = current_q_num if current_q_num else f"Q{q_counter}"
                    q = Question(paper_id=paper.id, question_number=q_num, question_text=q_text, marks=10.0)
                    db.add(q)
                    q_counter += 1
            current_q_text = []
            current_q_num = None

        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            match = question_pattern.match(line)
            number_match = re.compile(r'^(Q?\d+[a-zA-Z]?[\.\)\-])\s+(.*)', re.IGNORECASE).match(line)
            
            if match or number_match:
                save_heuristic_question()
                if number_match:
                    current_q_num = number_match.group(1).strip()
                    current_q_text = [number_match.group(2)]
                else:
                    current_q_text = [line]
            else:
                if current_q_text:
                    current_q_text.append(line)
                    
        save_heuristic_question()
        db.commit()
