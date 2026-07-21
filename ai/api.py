"""
InvertiQ AI Layer - FastAPI Application
Exposes endpoints for RAG-based crime intelligence queries
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

from rag import RAGEngine
from embed import EmbeddingService
from ingest import DocumentIngestor
from llm import LLMService

app = FastAPI(title="InvertiQ AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGEngine()
embedder = EmbeddingService()
ingestor = DocumentIngestor()
llm = LLMService()


class QueryRequest(BaseModel):
    query: str
    history: Optional[List[dict]] = []
    top_k: Optional[int] = 5


class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 10


class EmbedRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"status": "online", "model": "InvertiQ-RAG-v2"}


@app.post("/ask")
async def ask(req: QueryRequest):
    try:
        context_docs = rag.retrieve(req.query, top_k=req.top_k)
        response = llm.generate(req.query, context_docs, req.history)
        return {
            "response": response["text"],
            "confidence": response["confidence"],
            "sources": [d["source"] for d in context_docs[:3]],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
async def search(req: SearchRequest):
    try:
        results = rag.retrieve(req.query, top_k=req.top_k)
        return {"results": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embed")
async def embed(req: EmbedRequest):
    try:
        vector = embedder.encode(req.text)
        return {"embedding": vector.tolist(), "dimensions": len(vector)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    try:
        content = await file.read()
        result = ingestor.ingest_bytes(content, file.filename)
        return {"success": True, "chunks": result["chunks"], "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
