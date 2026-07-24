import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/warrants.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

with engine.connect() as conn:
    criminal_map = {r[0]: r[1] for r in conn.execute(text("SELECT criminal_id, id FROM criminals")).fetchall()}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO warrants (excel_id, criminal_id, warrant_type, issue_date, expiry_date, status)
            VALUES (:excel_id, :criminal_id, :warrant_type, :issue_date, :expiry_date, :status)
            ON CONFLICT (excel_id) DO NOTHING
        """), {
            "excel_id":     row["Warrant_ID"],
            "criminal_id":  criminal_map.get(row["Criminal_ID"]),
            "warrant_type": row["Type"],
            "issue_date":   None if pd.isna(row["Issue_Date"]) else row["Issue_Date"],
            "expiry_date":  None if pd.isna(row["Expiry_Date"]) else row["Expiry_Date"],
            "status":       row["Status"],
        })
        inserted += 1

print(f"Inserted {inserted} records into warrants table.")
