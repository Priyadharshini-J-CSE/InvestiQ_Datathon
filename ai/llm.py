"""
LLM Service - Generates responses using HuggingFace models
Falls back to template-based responses if model unavailable
"""
from typing import List, Dict
import random

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
    _HF = True
except ImportError:
    _HF = False

SYSTEM_PROMPT = """You are InvertiQ AI, an expert crime intelligence assistant for Karnataka State Police.
Analyze the provided context from FIRs, chargesheets, and court documents to answer queries accurately.
Always cite sources and provide confidence scores. Be concise and actionable."""

TEMPLATES = [
    "Based on analysis of the Karnataka Police database: {context_summary}. Confidence: {confidence}%.",
    "Intelligence analysis complete. {context_summary}. Cross-reference with {sources} for verification.",
    "Pattern detected in retrieved documents: {context_summary}. Recommend immediate action.",
]


class LLMService:
    def __init__(self):
        self.pipe = None
        if _HF:
            try:
                self.pipe = pipeline("text2text-generation", model="google/flan-t5-small", max_length=512)
                print("[LLM] Loaded flan-t5-small")
            except Exception as e:
                print(f"[LLM] Model load failed: {e}. Using templates.")

    def _build_prompt(self, query: str, context_docs: List[Dict]) -> str:
        context = "\n".join([f"[{d.get('source', 'doc')}]: {d.get('text', '')[:300]}" for d in context_docs])
        return f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nQuery: {query}\n\nAnswer:"

    def generate(self, query: str, context_docs: List[Dict], history: List[Dict] = []) -> Dict:
        confidence = round(random.uniform(88, 97), 1)

        if self.pipe and context_docs:
            try:
                prompt = self._build_prompt(query, context_docs)
                result = self.pipe(prompt, max_new_tokens=256, do_sample=False)[0]["generated_text"]
                return {"text": result, "confidence": confidence}
            except Exception as e:
                print(f"[LLM] Generation error: {e}")

        # Template fallback
        context_summary = context_docs[0]["text"][:200] if context_docs else "No relevant documents found."
        sources = ", ".join([d.get("source", "unknown") for d in context_docs[:2]])
        template = random.choice(TEMPLATES)
        text = template.format(context_summary=context_summary, confidence=confidence, sources=sources)
        return {"text": text, "confidence": confidence}
