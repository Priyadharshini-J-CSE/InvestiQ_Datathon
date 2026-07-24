"""
migrate.py  –  Create all PostgreSQL tables from SQLAlchemy models.

Usage:
    python backend/scripts/migrate.py

What it does:
    1. Reads .env from backend/scripts/.env
    2. Connects to PostgreSQL
    3. Creates every table defined in models.py (CREATE TABLE IF NOT EXISTS)
    4. Adds any missing columns to existing tables (safe ALTER TABLE)
    5. Reports what was created / already existed
    6. Does NOT import any data
"""

import os
import sys
from pathlib import Path

# resolve paths
SCRIPT_DIR  = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_DIR = BACKEND_DIR.parent

from dotenv import load_dotenv
load_dotenv(SCRIPT_DIR / ".env")

from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError

from models import (
    Base,
    User, District, PoliceStation,
    Person, Officer, Criminal,
    FIR, Case, Charge, Arrest,
    Conviction, Evidence, Wanted, Warrant,
    AuditLog, ActivityLog,
)

from db import get_engine, DATABASE_URL, PG_HOST, PG_PORT, PG_DB, PG_USER

# ── helpers ───────────────────────────────────────────────────────────────────

def print_banner(msg: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {msg}")
    print(f"{'=' * 60}")


def get_existing_tables(engine) -> set:
    inspector = inspect(engine)
    return set(inspector.get_table_names())


def get_existing_columns(engine, table_name: str) -> set:
    inspector = inspect(engine)
    return {col["name"] for col in inspector.get_columns(table_name)}


def add_missing_columns(engine, table_name: str, model_class) -> list:
    """
    For an already-existing table, add any columns that are in the model
    but not yet in the database.  Returns list of added column names.
    """
    existing_cols = get_existing_columns(engine, table_name)
    added = []

    for col in model_class.__table__.columns:
        if col.name in existing_cols:
            continue

        # Build a minimal ALTER TABLE statement
        col_type = col.type.compile(engine.dialect)
        nullable  = "" if col.nullable else " NOT NULL"
        default   = ""
        if col.default is not None and col.default.is_scalar:
            raw = col.default.arg
            if isinstance(raw, str):
                default = f" DEFAULT '{raw}'"
            elif isinstance(raw, bool):
                default = f" DEFAULT {'TRUE' if raw else 'FALSE'}"
            elif raw is not None:
                default = f" DEFAULT {raw}"

        ddl = (
            f'ALTER TABLE "{table_name}" '
            f'ADD COLUMN IF NOT EXISTS "{col.name}" {col_type}{nullable}{default};'
        )
        try:
            with engine.begin() as conn:
                conn.execute(text(ddl))
            added.append(col.name)
        except Exception as exc:
            print(f"    [WARN] Could not add column {col.name}: {exc}")

    return added


# ── ordered list of (table_name, model_class) ─────────────────────────────────
# Must follow FK dependency order
MODELS_IN_ORDER = [
    ("users",          User),
    ("districts",      District),
    ("police_stations",PoliceStation),
    ("persons",        Person),
    ("officers",       Officer),
    ("criminals",      Criminal),
    ("firs",           FIR),
    ("cases",          Case),
    ("charges",        Charge),
    ("arrests",        Arrest),
    ("convictions",    Conviction),
    ("evidence",       Evidence),
    ("wanted",         Wanted),
    ("warrants",       Warrant),
    ("audit_logs",     AuditLog),
    ("activity_logs",  ActivityLog),
]


# ── main ──────────────────────────────────────────────────────────────────────

def run_migration() -> None:
    print_banner("InvestiQ - PostgreSQL Migration")
    print(f"  Host : {PG_HOST}:{PG_PORT}")
    print(f"  DB   : {PG_DB}")
    print(f"  User : {PG_USER}")

    # 1. connect
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("\n  [OK] Connected to PostgreSQL")
    except OperationalError as exc:
        print(f"\n  [ERROR] Cannot connect to PostgreSQL:\n  {exc}")
        sys.exit(1)

    # 2. get tables that already exist
    existing = get_existing_tables(engine)
    print(f"\n  Existing tables found : {len(existing)}")

    created  = []
    updated  = []
    skipped  = []

    # 3. process each model
    print()
    for table_name, model_cls in MODELS_IN_ORDER:
        if table_name not in existing:
            # create fresh
            try:
                model_cls.__table__.create(engine, checkfirst=True)
                print(f"  [CREATED]  {table_name}")
                created.append(table_name)
            except Exception as exc:
                print(f"  [ERROR]    {table_name}: {exc}")
        else:
            # table exists – add any missing columns
            added_cols = add_missing_columns(engine, table_name, model_cls)
            if added_cols:
                print(f"  [UPDATED]  {table_name}  (+{len(added_cols)} columns: {', '.join(added_cols)})")
                updated.append(table_name)
            else:
                print(f"  [EXISTS]   {table_name}  (no changes needed)")
                skipped.append(table_name)

    # 4. summary
    print_banner("Migration Summary")
    print(f"  Tables created  : {len(created)}")
    if created:
        for t in created:
            print(f"    + {t}")

    print(f"  Tables updated  : {len(updated)}")
    if updated:
        for t in updated:
            print(f"    ~ {t}")

    print(f"  Tables unchanged: {len(skipped)}")
    if skipped:
        for t in skipped:
            print(f"    = {t}")

    print(f"\n  Total tables in DB: {len(get_existing_tables(engine))}")
    print("\n  Migration completed successfully.\n")


if __name__ == "__main__":
    run_migration()
