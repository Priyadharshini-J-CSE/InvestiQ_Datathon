"""
Document Ingestor - Reads PDFs, splits into chunks, stores in FAISS
"""
import os
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict

try:
    import faiss
    _FAISS = True
except ImportError:
    _FAISS = False

try:
    from PyPDF2 import PdfReader
    _PDF = True
except ImportError:
    _PDF = False

from embed import EmbeddingService

VECTOR_DB_PATH = Path("vector_db")
INDEX_FILE = VECTOR_DB_PATH / "faiss.index"
META_FILE = VECTOR_DB_PATH / "metadata.pkl"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i:i + size]))
        i += size - overlap
    return chunks


class DocumentIngestor:
    def __init__(self):
        self.embedder = EmbeddingService()
        self.index = None
        self.metadata: List[Dict] = []
        VECTOR_DB_PATH.mkdir(exist_ok=True)
        self._load_index()

    def _load_index(self):
        if INDEX_FILE.exists() and META_FILE.exists() and _FAISS:
            self.index = faiss.read_index(str(INDEX_FILE))
            with open(META_FILE, "rb") as f:
                self.metadata = pickle.load(f)
            print(f"[Ingest] Loaded index with {self.index.ntotal} vectors")

    def _save_index(self):
        if _FAISS and self.index:
            faiss.write_index(self.index, str(INDEX_FILE))
        with open(META_FILE, "wb") as f:
            pickle.dump(self.metadata, f)

    def _extract_pdf_text(self, content: bytes) -> str:
        if not _PDF:
            return "PDF parsing unavailable. Install PyPDF2."
        import io
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    def ingest_bytes(self, content: bytes, filename: str) -> Dict:
        if filename.endswith(".pdf"):
            text = self._extract_pdf_text(content)
        else:
            text = content.decode("utf-8", errors="ignore")

        chunks = chunk_text(text)
        embeddings = self.embedder.encode_batch(chunks)

        if _FAISS:
            dim = embeddings.shape[1]
            if self.index is None:
                self.index = faiss.IndexFlatIP(dim)
            self.index.add(embeddings.astype(np.float32))
        
        for i, chunk in enumerate(chunks):
            self.metadata.append({"source": filename, "chunk_id": i, "text": chunk})

        self._save_index()
        return {"chunks": len(chunks), "filename": filename}

    def ingest_directory(self, data_dir: str = "data"):
        path = Path(data_dir)
        for f in path.glob("*.pdf"):
            print(f"[Ingest] Processing {f.name}...")
            self.ingest_bytes(f.read_bytes(), f.name)
        print(f"[Ingest] Done. Total vectors: {len(self.metadata)}")


if __name__ == "__main__":
    ingestor = DocumentIngestor()
    ingestor.ingest_directory("data")
