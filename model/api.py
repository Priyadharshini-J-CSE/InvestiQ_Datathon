import os
import sys
import pickle
import types
import traceback
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

import numpy as np
import faiss
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from groq import Groq

# ── Pickle-compatible stub for langchain_core.documents.Document ──────────────
class _Document:
    def __init__(self, page_content='', metadata=None, **kwargs):
        self.page_content = page_content
        self.metadata = metadata or {}

    def __setstate__(self, state):
        self.__dict__.update(state)

    def __repr__(self):
        return f"Document(page_content={str(self.page_content)[:60]!r})"


def _make_document_module(name):
    mod = types.ModuleType(name)
    mod.Document = _Document
    return mod


for _path in [
    'langchain_core',
    'langchain_core.documents',
    'langchain_core.documents.base',
    'langchain.schema',
    'langchain.schema.document',
    'langchain_community',
    'langchain_community.schema',
]:
    if _path not in sys.modules:
        sys.modules[_path] = _make_document_module(_path)
    else:
        if not hasattr(sys.modules[_path], 'Document'):
            sys.modules[_path].Document = _Document

# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

BASE_PATH = os.path.join(os.path.dirname(__file__), "train")

GROQ_MODEL = "llama-3.1-8b-instant"

# ── Content extraction (handles Pydantic v2 nested __dict__) ──────────────────

def extract_content(doc):
    # Pydantic v2: actual fields live inside doc.__dict__['__dict__']
    nested = doc.__dict__.get('__dict__', {})
    if isinstance(nested, dict):
        for attr in ('page_content', 'text', 'content', 'body'):
            val = nested.get(attr)
            if val and isinstance(val, str) and val.strip():
                return val.strip()
    # Direct attribute fallback (plain objects / already-fixed stubs)
    for attr in ('page_content', 'text', 'content', 'body'):
        val = getattr(doc, attr, None)
        if val and isinstance(val, str) and val.strip():
            return val.strip()
    # Last resort: stringify
    return str(doc)


def extract_metadata(doc):
    nested = doc.__dict__.get('__dict__', {})
    if isinstance(nested, dict) and isinstance(nested.get('metadata'), dict):
        return nested['metadata']
    m = getattr(doc, 'metadata', None)
    return m if isinstance(m, dict) else {}


# ── Load artifacts ────────────────────────────────────────────────────────────
print("=" * 60)
print("Loading InvestiQ model artifacts...")

index = None
documents = []
raw_metadata = []
embeddings = None
encoder = None

try:
    index = faiss.read_index(os.path.join(BASE_PATH, "faiss.index"))
    print(f"  [OK] FAISS index: {index.ntotal} vectors")
except Exception as e:
    print(f"  [FAIL] FAISS index: {e}")
    traceback.print_exc()

try:
    with open(os.path.join(BASE_PATH, "documents.pkl"), "rb") as f:
        raw_documents = pickle.load(f)
    print(f"  [OK] documents.pkl: {len(raw_documents)} docs")
except Exception as e:
    print(f"  [FAIL] documents.pkl: {e}")
    traceback.print_exc()
    raw_documents = []

try:
    with open(os.path.join(BASE_PATH, "metadata.pkl"), "rb") as f:
        raw_metadata = pickle.load(f)
    print(f"  [OK] metadata.pkl: {len(raw_metadata)} entries")
except Exception as e:
    print(f"  [FAIL] metadata.pkl: {e}")
    traceback.print_exc()

try:
    embeddings = np.load(os.path.join(BASE_PATH, "embeddings.npy"))
    print(f"  [OK] embeddings.npy: shape {embeddings.shape}")
except Exception as e:
    print(f"  [FAIL] embeddings.npy: {e}")
    traceback.print_exc()

# Normalize all documents to plain dicts
for i, doc in enumerate(raw_documents):
    content = extract_content(doc)
    meta = extract_metadata(doc)
    if not meta and i < len(raw_metadata):
        m = raw_metadata[i]
        meta = m if isinstance(m, dict) else {}
    documents.append({"content": content, "metadata": meta})

print(f"  [OK] Normalized {len(documents)} documents")
if documents:
    print(f"  Sample: {documents[0]['content'][:100]!r}")

try:
    encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")
    print("  [OK] Encoder: BAAI/bge-small-en-v1.5")
except Exception as e:
    print(f"  [FAIL] Encoder: {e}")
    traceback.print_exc()

# ── Groq client ───────────────────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
if not GROQ_API_KEY:
    print("  [WARN] GROQ_API_KEY is not set! Check model/.env")
else:
    print(f"  [OK] GROQ_API_KEY loaded (starts with: {GROQ_API_KEY[:8]}...)")

groq_client = Groq(api_key=GROQ_API_KEY)
print(f"  [OK] Groq client ready — model: {GROQ_MODEL}")
print("=" * 60)


# ── Greeting detection ────────────────────────────────────────────────────────
GREETINGS = {"hi", "hello", "hey", "namaste", "vanakkam", "good morning",
             "good afternoon", "good evening", "help", "who are you", "what can you do"}

def is_greeting(query: str) -> bool:
    return query.lower().strip().rstrip('!?.') in GREETINGS


GREETING_RESPONSE = """Hello! I'm **InvestiQ AI**, your intelligent crime investigation assistant for Tamil Nadu Police.

I can help you with:
• **FIR Lookup** — Search and summarize First Information Reports
• **Criminal Profiles** — Find records on accused persons
• **Case Analysis** — Investigate open/closed cases
• **Crime Patterns** — Detect repeat offenders and hotspots
• **Wanted Persons** — Query wanted criminal database
• **Legal Reference** — Explain IPC sections and charges
• **Evidence & Warrants** — Track evidence and warrant status

How can I assist you today, Officer?"""


# ── RAG pipeline ──────────────────────────────────────────────────────────────

def retrieve_context(query: str, top_k: int = 5) -> list:
    if not encoder or not index or not documents:
        return []
    try:
        query_embedding = encoder.encode(
            [query], normalize_embeddings=True
        ).astype("float32")
        distances, indices = index.search(query_embedding, top_k)
        results = []
        for i, idx in enumerate(indices[0]):
            if 0 <= idx < len(documents):
                doc = documents[idx]
                results.append({
                    "content": doc["content"],
                    "metadata": doc["metadata"],
                    "score": float(distances[0][i])
                })
        return results
    except Exception as e:
        print(f"[ERROR] retrieve_context: {e}")
        traceback.print_exc()
        return []


def build_prompt(query: str, context_docs: list) -> str:
    if context_docs:
        context = "\n\n".join([
            f"[Document {i+1}]\n{doc['content']}"
            for i, doc in enumerate(context_docs)
            if doc['content'].strip()
        ])
    else:
        context = "No specific records found in the database for this query."

    return f"""You are InvestiQ AI, an intelligent crime investigation assistant for Tamil Nadu Police.
You have access to a database of FIRs, criminal records, chargesheets, warrants, wanted persons, and case data.
Answer the officer's query based on the retrieved context. Be precise, structured, and actionable.
If no relevant context is found, say so clearly and offer general guidance.

CONTEXT:
{context}

OFFICER QUERY: {query}

Provide a clear, structured answer. Use bullet points where appropriate."""


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        return jsonify({"success": False, "error": "Invalid JSON body"}), 400

    query = (data.get("query") or "").strip()
    history = data.get("history") or []

    if not query:
        return jsonify({"success": False, "error": "Query is required"}), 400

    # Check GROQ key before attempting
    if not GROQ_API_KEY:
        return jsonify({
            "success": False,
            "error": "GROQ_API_KEY is not configured. Add it to model/.env"
        }), 500

    # Handle greetings without hitting Groq
    if is_greeting(query):
        return jsonify({
            "success": True,
            "response": GREETING_RESPONSE,
            "confidence": 100.0,
            "sources": []
        })

    try:
        context_docs = retrieve_context(query, top_k=5)
        prompt = build_prompt(query, context_docs)

        messages = [{
            "role": "system",
            "content": (
                "You are InvestiQ AI, a crime intelligence assistant for Tamil Nadu Police. "
                "Answer clearly, concisely, and in a structured format. "
                "Never make up case numbers or criminal names not present in the context."
            )
        }]
        for h in history[-6:]:
            role = h.get("role", "")
            content = h.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": prompt})

        print(f"[INFO] Calling Groq model={GROQ_MODEL} query={query[:60]!r}")

        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.3,
        )

        answer = response.choices[0].message.content

        sources = []
        for doc in context_docs:
            meta = doc.get("metadata", {})
            src = (meta.get("fir_number") or meta.get("source") or
                   meta.get("id") or meta.get("file") or "")
            if src and str(src) not in sources:
                sources.append(str(src))

        confidence = 85.0
        if context_docs:
            score = context_docs[0]["score"]
            confidence = round(min(97, max(70, 100 - score * 8)), 1)

        print(f"[INFO] Response generated. confidence={confidence} sources={sources[:3]}")

        return jsonify({
            "success": True,
            "response": answer,
            "confidence": confidence,
            "sources": sources[:3]
        })

    except Exception as e:
        print(f"[ERROR] /ask endpoint failed:")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": GROQ_MODEL,
        "documents": len(documents),
        "index_vectors": index.ntotal if index else 0,
        "encoder": encoder is not None,
        "groq_key_set": bool(GROQ_API_KEY)
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
