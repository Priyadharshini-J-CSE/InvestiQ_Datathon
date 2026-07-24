import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/charges.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

with engine.connect() as conn:
    criminal_map = {r[0]: r[1] for r in conn.execute(text("SELECT criminal_id, id FROM criminals")).fetchall()}
    case_map     = {r[0]: r[1] for r in conn.execute(text("SELECT case_number, id FROM cases")).fetchall()}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO charges (criminal_id, case_id, ipc_section, description)
            VALUES (:criminal_id, :case_id, :ipc_section, :description)
        """), {
            "criminal_id": criminal_map.get(row["Criminal_ID"]),
            "case_id":     case_map.get(row["FIR_ID"]),   # FIR_ID links to case via case_number
            "ipc_section": row["IPC"],
            "description": row["Section_Name"],
        })
        inserted += 1

print(f"Inserted {inserted} records into charges table.")
