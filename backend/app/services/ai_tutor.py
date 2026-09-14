import json
from sqlalchemy.orm import Session
from app.db.models import AISession, Topic, User
from app.nlp.ai_provider import get_ai_provider

def generate_tutor_response(db: Session, user_id: int, prompt: str, topic_id: int = None) -> AISession:
    context = ""
    if topic_id:
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if topic:
            context = f"The student is asking about the following topic from their syllabus:\nTopic: {topic.name}\nDescription: {topic.description}\n\n"
            
    system_prompt = """
    You are an AI Tutor for university students. 
    Explain concepts clearly, provide examples, and answer questions based on the provided syllabus context if any.
    Keep your answers concise, structured, and pedagogical.
    """
    
    full_prompt = context + f"Student's question: {prompt}"
    
    ai = get_ai_provider()
    
    response_text = "I'm sorry, I couldn't process your request at this time."
    try:
        response_text = ai.generate_response(full_prompt, system_prompt=system_prompt)
    except Exception as e:
        response_text = f"An error occurred while generating a response: {str(e)}"
        
    ai_session = AISession(
        user_id=user_id,
        topic_id=topic_id,
        prompt=prompt,
        response=response_text
    )
    
    db.add(ai_session)
    db.commit()
    db.refresh(ai_session)
    
    return ai_session
