import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/evidence.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

with engine.connect() as conn:
    # FIR_ID in evidence maps to case via fir_number -> firs.id -> cases.fir_id
    case_map    = {r[0]: r[1] for r in conn.execute(text("SELECT case_number, id FROM cases")).fetchall()}
    officer_map = {r[0]: r[1] for r in conn.execute(text("SELECT badge_number, id FROM officers")).fetchall()}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO evidence (case_id, evidence_type, description, collected_by, file_url)
            VALUES (:case_id, :evidence_type, :description, :collected_by, :file_url)
        """), {
            "case_id":       case_map.get(row["FIR_ID"]),
            "evidence_type": row["Type"],
            "description":   row["Description"],
            "collected_by":  officer_map.get(row["Uploaded_By"]),
            "file_url":      row["File_Name"],
        })
        inserted += 1

print(f"Inserted {inserted} records into evidence table.")
