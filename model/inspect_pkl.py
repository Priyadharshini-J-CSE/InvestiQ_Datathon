import pickle
import sys
import types

class D:
    def __setstate__(self, state):
        self.__dict__.update(state)
    def __init__(self, **kw):
        self.__dict__.update(kw)

for path in ['langchain_core', 'langchain_core.documents', 'langchain_core.documents.base',
             'langchain.schema', 'langchain.schema.document']:
    mod = types.ModuleType(path)
    mod.Document = D
    sys.modules[path] = mod

with open(r'd:\semester 5\datathon\InvestiQ_Datathon\model\train\documents.pkl', 'rb') as f:
    docs = pickle.load(f)

print("Total docs:", len(docs))
print("Type:", type(docs[0]))
print("__dict__ keys:", list(docs[0].__dict__.keys()))
for k, v in docs[0].__dict__.items():
    print(f"  {k}: {str(v)[:300]}")

inner = docs[0].__dict__.get('__dict__', {})
print("\nNested __dict__:", inner)
print("page_content value:", str(inner.get('page_content','NOT FOUND'))[:200])

print("\n--- metadata.pkl ---")
with open(r'd:\semester 5\datathon\InvestiQ_Datathon\model\train\metadata.pkl', 'rb') as f:
    meta = pickle.load(f)
print("Total metadata:", len(meta))
print("Type of meta[0]:", type(meta[0]))
print("meta[0]:", meta[0])
