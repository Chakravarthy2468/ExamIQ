from sentence_transformers import SentenceTransformer
import numpy as np

# Load a lightweight model for sentence embeddings
# "all-MiniLM-L6-v2" is good for fast semantic similarity
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    print(f"Warning: Failed to load SentenceTransformer: {e}")
    model = None

def get_embedding(text: str) -> np.ndarray:
    if model is None:
        return np.zeros(384) # Fallback dimension for MiniLM
    embedding = model.encode(text)
    return embedding
