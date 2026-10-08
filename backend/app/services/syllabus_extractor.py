import json
import logging
import re
from sqlalchemy.orm import Session
from app.db.models import Document, Unit, Topic

logger = logging.getLogger(__name__)

def extract_syllabus_from_text(db: Session, doc: Document, text: str):
    try:
        from app.nlp.ai_provider import get_ai_provider
        ai = get_ai_provider()
        
        system_prompt = """
        You are an expert at extracting syllabus topics from a course outline or syllabus document.
        Given the raw text of a syllabus, extract all the distinct units and their topics.
        Return the output as a JSON object with a single key "units", which is an array of objects.
        Each unit object must have:
        - "unit_number": integer
        - "unit_title": string
        - "topics": array of strings (the topics covered in this unit)
        Do not include any other text or markdown outside the JSON structure.
        """
        
        prompt = f"Raw Syllabus Text:\n{text[:5000]}" # Limit to first 5000 chars to avoid token limits
        
        response_str = ai.generate_response(prompt, system_prompt=system_prompt, json_format=True)
        match = re.search(r'\{.*\}', response_str, re.DOTALL)
        if match:
            response_str = match.group(0)
            
        data = json.loads(response_str)
        units_data = data.get("units", [])
        
        # Delete existing syllabus data for this course to avoid duplicates
        existing_units = db.query(Unit).filter(Unit.course_id == doc.course_id).all()
        for eu in existing_units:
            db.query(Topic).filter(Topic.unit_id == eu.id).delete(synchronize_session=False)
            db.delete(eu)
        db.commit()
        
        for u_data in units_data:
            unit = Unit(
                course_id=doc.course_id,
                title=u_data.get("unit_title", f"Unit {u_data.get('unit_number')}"),
                unit_number=u_data.get("unit_number", 1)
            )
            db.add(unit)
            db.flush() # To get unit.id
            
            for topic_name in u_data.get("topics", []):
                topic = Topic(
                    unit_id=unit.id,
                    name=topic_name,
                    description=""
                )
                db.add(topic)
                
        db.commit()
    except Exception as e:
        logger.error(f"AI Syllabus Extraction failed: {e}")
        # Fallback to basic heuristics
        db.rollback()
        
        # Clean up existing to be safe
        existing_units = db.query(Unit).filter(Unit.course_id == doc.course_id).all()
        for eu in existing_units:
            db.query(Topic).filter(Topic.unit_id == eu.id).delete(synchronize_session=False)
            db.delete(eu)
        db.commit()
        
        # Basic heuristic fallback
        unit = Unit(course_id=doc.course_id, title="General Syllabus", unit_number=1)
        db.add(unit)
        db.flush()
        
        # Just grab lines that look like topics
        lines = [line.strip() for line in text.split('\n') if line.strip() and len(line.strip()) > 5 and len(line.strip()) < 100]
        # Take a sample of lines
        for line in list(set(lines))[:20]:
            topic = Topic(unit_id=unit.id, name=line, description="")
            db.add(topic)
            
        db.commit()
