"""
Embedding Service using Sentence Transformers
Generates dense vector embeddings for semantic search
"""
import numpy as np
from typing import List, Union

try:
    from sentence_transformers import SentenceTransformer
    _MODEL_AVAILABLE = True
except ImportError:
    _MODEL_AVAILABLE = False


class EmbeddingService:
    MODEL_NAME = "all-MiniLM-L6-v2"

    def __init__(self):
        self.model = None
        self.dim = 384
        if _MODEL_AVAILABLE:
            try:
                self.model = SentenceTransformer(self.MODEL_NAME)
                print(f"[Embed] Loaded model: {self.MODEL_NAME}")
            except Exception as e:
                print(f"[Embed] Model load failed: {e}. Using random embeddings.")

    def encode(self, text: Union[str, List[str]]) -> np.ndarray:
        if self.model:
            return self.model.encode(text, normalize_embeddings=True)
        # Fallback: deterministic pseudo-embedding based on text hash
        if isinstance(text, str):
            np.random.seed(hash(text) % (2**31))
            return np.random.randn(self.dim).astype(np.float32)
        return np.array([self.encode(t) for t in text])

    def encode_batch(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        if self.model:
            return self.model.encode(texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=True)
        return np.array([self.encode(t) for t in texts])
