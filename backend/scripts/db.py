"""
db.py  -  Shared SQLAlchemy engine + session factory for InvestiQ scripts.
Reads credentials from backend/scripts/.env
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load .env from the same directory as this file
load_dotenv(Path(__file__).resolve().parent / ".env")

PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")
PG_DB   = os.getenv("POSTGRES_DB",   "investiq")
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASS = os.getenv("POSTGRES_PASSWORD", "")

# Force TCP on Windows: replace 'localhost' with 127.0.0.1
_host = "127.0.0.1" if PG_HOST == "localhost" else PG_HOST
DATABASE_URL = f"postgresql+psycopg2://{PG_USER}:{PG_PASS}@{_host}:{PG_PORT}/{PG_DB}"


def get_engine(echo: bool = False):
    return create_engine(
        DATABASE_URL,
        echo=echo,
        connect_args={"host": PG_HOST, "port": int(PG_PORT)},
    )


def get_session(engine=None):
    if engine is None:
        engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()
