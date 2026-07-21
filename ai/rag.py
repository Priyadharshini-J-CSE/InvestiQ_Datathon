"""
RAG Engine - Retrieval Augmented Generation
Performs semantic search over FAISS index and retrieves context
"""
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict

try:
    import faiss
    _FAISS = True
except ImportError:
    _FAISS = False

from embed import EmbeddingService

VECTOR_DB_PATH = Path("vector_db")
INDEX_FILE = VECTOR_DB_PATH / "faiss.index"
META_FILE = VECTOR_DB_PATH / "metadata.pkl"

# Fallback mock documents for demo
MOCK_DOCS = [
    {"source": "FIR-2024-01045.pdf", "text": "Chain snatching incident near MG Road, Bengaluru. Accused: Ravi Kumar. IPC 379. Witness: 2 persons.", "score": 0.95},
    {"source": "Chargesheet-892.pdf", "text": "Organized theft ring operating in Koramangala and Whitefield. 5 accused identified. Pattern: Late night operations.", "score": 0.91},
    {"source": "Judgement-2023-CR-445.pdf", "text": "Court convicted accused under IPC 379 and 411. Sentenced to 3 years rigorous imprisonment.", "score": 0.87},
]


class RAGEngine:
    def __init__(self):
        self.embedder = EmbeddingService()
        self.index = None
        self.metadata: List[Dict] = []
        self._load()

    def _load(self):
        if INDEX_FILE.exists() and META_FILE.exists() and _FAISS:
            try:
                self.index = faiss.read_index(str(INDEX_FILE))
                with open(META_FILE, "rb") as f:
                    self.metadata = pickle.load(f)
                print(f"[RAG] Loaded {self.index.ntotal} vectors")
            except Exception as e:
                print(f"[RAG] Load failed: {e}")

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        if self.index is None or self.index.ntotal == 0:
            return MOCK_DOCS[:top_k]

        query_vec = self.embedder.encode(query).reshape(1, -1).astype(np.float32)
        scores, indices = self.index.search(query_vec, min(top_k, self.index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(self.metadata):
                doc = dict(self.metadata[idx])
                doc["score"] = float(score)
                results.append(doc)
        return results
