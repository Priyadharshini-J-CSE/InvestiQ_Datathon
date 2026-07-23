import os
import re
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

# ── Pickle stub for langchain_core ────────────────────────────────────────────
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
    'langchain_core', 'langchain_core.documents', 'langchain_core.documents.base',
    'langchain.schema', 'langchain.schema.document',
    'langchain_community', 'langchain_community.schema',
]:
    if _path not in sys.modules:
        sys.modules[_path] = _make_document_module(_path)
    elif not hasattr(sys.modules[_path], 'Document'):
        sys.modules[_path].Document = _Document

# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

BASE_PATH = os.path.join(os.path.dirname(__file__), "train")
GROQ_MODEL = "llama-3.1-8b-instant"

# ── Content / metadata extraction ─────────────────────────────────────────────

def extract_content(doc):
    nested = doc.__dict__.get('__dict__', {})
    if isinstance(nested, dict):
        for attr in ('page_content', 'text', 'content', 'body'):
            val = nested.get(attr)
            if val and isinstance(val, str) and val.strip():
                return val.strip()
    for attr in ('page_content', 'text', 'content', 'body'):
        val = getattr(doc, attr, None)
        if val and isinstance(val, str) and val.strip():
            return val.strip()
    return str(doc)


def extract_metadata(doc):
    nested = doc.__dict__.get('__dict__', {})
    if isinstance(nested, dict) and isinstance(nested.get('metadata'), dict):
        return nested['metadata']
    m = getattr(doc, 'metadata', None)
    return m if isinstance(m, dict) else {}


# ── Load artifacts ─────────────────────────────────────────────────────────────
print("=" * 60)
print("Loading InvestiQ model artifacts...")

index = None
documents = []
raw_metadata = []
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

# Normalize documents to plain dicts
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

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
if not GROQ_API_KEY:
    print("  [WARN] GROQ_API_KEY is not set! Check model/.env")
else:
    print(f"  [OK] GROQ_API_KEY loaded (starts with: {GROQ_API_KEY[:8]}...)")

groq_client = Groq(api_key=GROQ_API_KEY)
print(f"  [OK] Groq client ready — model: {GROQ_MODEL}")

# ── Build known-name index from metadata ──────────────────────────────────────
# Collect every name that actually exists in the database
KNOWN_NAMES: set = set()          # exact lowercase names
KNOWN_NAMES_ORIGINAL: list = []   # original casing for display

_name_fields = ('criminal', 'officer', 'person_name', 'accused', 'name')

for m in raw_metadata:
    if not isinstance(m, dict):
        continue
    for field in _name_fields:
        val = m.get(field, '')
        if val and isinstance(val, str) and val.strip():
            original = val.strip()
            KNOWN_NAMES.add(original.lower())
            if original not in KNOWN_NAMES_ORIGINAL:
                KNOWN_NAMES_ORIGINAL.append(original)

# Also scan page_content for "Person Name : XYZ" patterns
_name_pattern = re.compile(r'Person Name\s*:\s*(.+)', re.IGNORECASE)
for doc in documents:
    for match in _name_pattern.finditer(doc['content']):
        original = match.group(1).strip()
        KNOWN_NAMES.add(original.lower())
        if original not in KNOWN_NAMES_ORIGINAL:
            KNOWN_NAMES_ORIGINAL.append(original)

print(f"  [OK] Known names indexed: {len(KNOWN_NAMES_ORIGINAL)}")
print(f"  Names: {KNOWN_NAMES_ORIGINAL}")
print("=" * 60)


# ── Name validation helpers ───────────────────────────────────────────────────

# Keywords that signal a person-name query
_PERSON_QUERY_PATTERNS = re.compile(
    r'\b(details?|profile|record|info|information|report|case|fir|criminal|about|show|find|search|get|lookup|who is|wanted)\b',
    re.IGNORECASE
)

# Stop words to strip from query before name extraction
_STOP_WORDS = {
    'show', 'me', 'the', 'details', 'detail', 'of', 'for', 'about',
    'profile', 'record', 'records', 'info', 'information', 'report',
    'criminal', 'person', 'find', 'search', 'get', 'lookup', 'give',
    'all', 'cases', 'case', 'fir', 'data', 'who', 'is', 'a', 'an',
    'please', 'can', 'you', 'tell', 'what', 'are', 'his', 'her',
}


def extract_name_from_query(query: str) -> str | None:
    """
    Try to extract a person name being searched in the query.
    Returns the candidate name string or None if no name query detected.
    """
    q = query.strip()

    # Remove punctuation except spaces and hyphens
    q_clean = re.sub(r"[^\w\s\-]", "", q)

    tokens = [t for t in q_clean.split() if t.lower() not in _STOP_WORDS]

    # If only 1-3 tokens remain after stripping stop words, treat as a name query
    if 1 <= len(tokens) <= 3:
        return " ".join(tokens)

    # If query contains person-query keywords, extract remaining tokens as name
    if _PERSON_QUERY_PATTERNS.search(q):
        # Remove matched keywords too
        keyword_tokens = set(re.findall(r'\b\w+\b', _PERSON_QUERY_PATTERNS.sub('', q).lower()))
        name_tokens = [t for t in q_clean.split() if t.lower() not in _STOP_WORDS and t.lower() not in keyword_tokens]
        if 1 <= len(name_tokens) <= 3:
            return " ".join(name_tokens)

    return None


def name_exists_in_db(candidate: str) -> tuple[bool, str | None]:
    """
    Check if the candidate name exists in the database.
    Returns (found: bool, matched_name: str | None).

    Rules:
    - Exact match (case-insensitive) → found
    - All words of candidate present in a known name → found
      e.g. "Priya Devi" searched as "priya devi" → found
    - Partial single-word match only if it's a FULL word match, not substring
      e.g. "priya" → NOT matched to "Priya Devi" (only first name given)
    - "raghul" → NOT matched to "Raghu" (different name)
    """
    candidate_lower = candidate.lower().strip()
    candidate_words = set(candidate_lower.split())

    # 1. Exact full match
    if candidate_lower in KNOWN_NAMES:
        # Return original casing
        for n in KNOWN_NAMES_ORIGINAL:
            if n.lower() == candidate_lower:
                return True, n
        return True, candidate

    # 2. All candidate words must be present as whole words in a known name
    #    AND the known name must not have significantly more words
    #    (prevents "raj" matching "Rajesh Kumar" — "raj" is not a whole word in "Rajesh")
    for known in KNOWN_NAMES_ORIGINAL:
        known_lower = known.lower()
        known_words = set(known_lower.split())

        # Every candidate word must exactly match a known word (not substring)
        if candidate_words.issubset(known_words):
            # Only allow if candidate covers most of the known name
            # e.g. "Priya Devi" (2 words) matches known "Priya Devi" (2 words) ✓
            # but "Priya" (1 word) should NOT match "Priya Devi" (2 words) ✗
            coverage = len(candidate_words) / len(known_words)
            if coverage >= 0.8:   # must cover ≥80% of the known name's words
                return True, known

    return False, None


# ── Greeting detection ────────────────────────────────────────────────────────
GREETINGS = {
    "hi", "hello", "hey", "namaste", "vanakkam",
    "good morning", "good afternoon", "good evening",
    "help", "who are you", "what can you do"
}

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


def retrieve_by_name(name: str) -> list:
    """Retrieve documents that exactly contain this name."""
    name_lower = name.lower()
    matched = []
    for doc in documents:
        content_lower = doc["content"].lower()
        meta = doc["metadata"]
        # Check metadata criminal field
        criminal = str(meta.get("criminal", "")).lower()
        officer = str(meta.get("officer", "")).lower()
        # Check content for exact name occurrence
        if (criminal == name_lower or
                officer == name_lower or
                f"person name : {name_lower}" in content_lower or
                f"person name :\n\n{name_lower}" in content_lower):
            matched.append({
                "content": doc["content"],
                "metadata": meta,
                "score": 0.0
            })
    return matched


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

STRICT RULES:
1. Only report information that is explicitly present in the CONTEXT below.
2. Do NOT infer, guess, or use similar names. If the context does not mention the exact person/case queried, say it is not found.
3. Do NOT present details of a different person as the queried person.
4. Be precise, structured, and actionable.

CONTEXT:
{context}

OFFICER QUERY: {query}

Provide a clear, structured answer based strictly on the context above."""


# ── Routes ─────────────────────────────────────────────────────────────────────

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

    if not GROQ_API_KEY:
        return jsonify({
            "success": False,
            "error": "GROQ_API_KEY is not configured. Add it to model/.env"
        }), 500

    # Handle greetings
    if is_greeting(query):
        return jsonify({
            "success": True,
            "response": GREETING_RESPONSE,
            "confidence": 100.0,
            "sources": []
        })

    # ── Name validation gate ──────────────────────────────────────────────────
    candidate_name = extract_name_from_query(query)
    print(f"[INFO] query={query!r}  candidate_name={candidate_name!r}")

    if candidate_name:
        found, matched_name = name_exists_in_db(candidate_name)
        print(f"[INFO] name_exists_in_db({candidate_name!r}) -> found={found}, matched={matched_name!r}")

        if not found:
            # Name is not in the database — return immediately, no LLM call
            return jsonify({
                "success": True,
                "response": (
                    f"No records found for **\"{candidate_name}\"** in the InvestiQ database.\n\n"
                    f"The name **\"{candidate_name}\"** does not match any criminal, accused person, "
                    f"or officer in our current dataset.\n\n"
                    f"Please verify the spelling or try searching by:\n"
                    f"• FIR Number (e.g. TNFIR20260001)\n"
                    f"• Case Number (e.g. CASE001)\n"
                    f"• District or Crime Type"
                ),
                "confidence": 100.0,
                "sources": []
            })

        # Name found — retrieve only documents that exactly match this name
        context_docs = retrieve_by_name(matched_name)
        if not context_docs:
            # Fallback to semantic search scoped to the matched name
            context_docs = retrieve_context(matched_name, top_k=5)

        print(f"[INFO] Retrieved {len(context_docs)} docs for name={matched_name!r}")

    else:
        # Not a name query — use normal semantic retrieval
        context_docs = retrieve_context(query, top_k=5)
        print(f"[INFO] Semantic retrieval: {len(context_docs)} docs")

    try:
        prompt = build_prompt(query, context_docs)

        messages = [{
            "role": "system",
            "content": (
                "You are InvestiQ AI, a crime intelligence assistant for Tamil Nadu Police. "
                "Answer ONLY based on the provided context. "
                "NEVER present details of a different person when a specific name is queried. "
                "If the exact name is not in the context, say it is not found. "
                "Never hallucinate names, case numbers, or facts."
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
            temperature=0.1,   # lower temp = more factual, less creative
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

        print(f"[INFO] Done. confidence={confidence} sources={sources[:3]}")

        return jsonify({
            "success": True,
            "response": answer,
            "confidence": confidence,
            "sources": sources[:3]
        })

    except Exception as e:
        print(f"[ERROR] /ask failed:")
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
        "groq_key_set": bool(GROQ_API_KEY),
        "known_names": len(KNOWN_NAMES_ORIGINAL)
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
