import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/cases.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

# Build FIR_Number -> firs.id lookup
with engine.connect() as conn:
    rows = conn.execute(text("SELECT fir_number, id FROM firs")).fetchall()
fir_map = {r[0]: r[1] for r in rows}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO cases (case_number, fir_id, court, judge, court_date, status)
            VALUES (:case_number, :fir_id, :court, :judge, :court_date, :status)
            ON CONFLICT (case_number) DO NOTHING
        """), {
            "case_number": row["Case_ID"],
            "fir_id":      fir_map.get(row["FIR_ID"]),
            "court":       row["Court_Name"],
            "judge":       row["Judge"],
            "court_date":  None if pd.isna(row["Hearing_Date"]) else row["Hearing_Date"],
            "status":      row["Status"],
        })
        inserted += 1

print(f"Inserted {inserted} records into cases table.")
