import pickle, sys, types

class D:
    def __setstate__(self, state):
        self.__dict__.update(state)
    def __init__(self, **kw):
        self.__dict__.update(kw)

for path in ['langchain_core','langchain_core.documents','langchain_core.documents.base']:
    mod = types.ModuleType(path)
    mod.Document = D
    sys.modules[path] = mod

with open(r'train\documents.pkl', 'rb') as f:
    docs = pickle.load(f)

doc = docs[0]
inner = doc.__dict__
nested = inner.get('__dict__', {})
print("nested keys:", list(nested.keys()))
print("page_content:", str(nested.get('page_content',''))[:300])
