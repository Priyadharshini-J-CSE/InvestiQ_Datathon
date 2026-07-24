from sqlalchemy import text
from db import get_engine, PG_HOST, PG_PORT, PG_DB, PG_USER

engine = get_engine()
with engine.connect() as conn:
    version = conn.execute(text("SELECT version()")).scalar()
    print(f"Connected to  : {PG_USER}@{PG_HOST}:{PG_PORT}/{PG_DB}")
    print(f"PG version    : {version}")
