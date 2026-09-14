import faiss
import numpy as np
from sqlalchemy.orm import Session
from app.db.models import Topic, Question, QuestionTopicMap
from app.nlp.embeddings import get_embedding

def build_faiss_index(db: Session, course_id: int):
    topics = db.query(Topic).join(Topic.unit).filter(Topic.unit.has(course_id=course_id)).all()
    if not topics:
        return None, {}

    dimension = 384  # MiniLM dimension
    index = faiss.IndexFlatIP(dimension) # Inner product (Cosine similarity if normalized)
    
    topic_map = {}
    embeddings = []
    
    for idx, topic in enumerate(topics):
        text_to_embed = f"{topic.name}. {topic.description or ''}"
        emb = get_embedding(text_to_embed)
        # Normalize for cosine similarity
        faiss.normalize_L2(emb.reshape(1, -1))
        embeddings.append(emb)
        topic_map[idx] = topic.id
        
    index.add(np.array(embeddings).astype('float32'))
    return index, topic_map

def map_questions_to_topics(db: Session, course_id: int):
    index, topic_map = build_faiss_index(db, course_id)
    if index is None:
        return
        
    questions = db.query(Question).join(Question.paper).join(QuestionPaper.document).filter(Document.course_id == course_id).all()
    
    for q in questions:
        # Check if already mapped manually
        existing_map = db.query(QuestionTopicMap).filter(QuestionTopicMap.question_id == q.id, QuestionTopicMap.is_faculty_approved == True).first()
        if existing_map:
            continue
            
        emb = get_embedding(q.question_text).reshape(1, -1)
        faiss.normalize_L2(emb)
        
        distances, indices = index.search(emb.astype('float32'), 3) # top 3
        
        top_similarity = float(distances[0][0])
        top_topic_id = topic_map[indices[0][0]]
        
        # Determine confidence
        if top_similarity > 0.75:
            confidence = "HIGH CONFIDENCE"
            conf_score = 0.9
        elif top_similarity > 0.5:
            confidence = "MEDIUM CONFIDENCE"
            conf_score = 0.6
        else:
            confidence = "LOW CONFIDENCE"
            conf_score = 0.3
            
        # If very low, maybe UNMAPPED
        if top_similarity < 0.3:
            confidence = "UNMAPPED"
            top_topic_id = None
            conf_score = 0.0

        if top_topic_id:
            # Delete old unapproved maps
            db.query(QuestionTopicMap).filter(QuestionTopicMap.question_id == q.id, QuestionTopicMap.is_faculty_approved == False).delete()
            
            new_map = QuestionTopicMap(
                question_id=q.id,
                topic_id=top_topic_id,
                similarity_score=top_similarity,
                confidence_score=conf_score,
                mapping_method="SEMANTIC"
            )
            db.add(new_map)
            
    db.commit()
