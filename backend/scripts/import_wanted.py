import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/wanted.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

with engine.connect() as conn:
    criminal_map = {r[0]: r[1] for r in conn.execute(text("SELECT criminal_id, id FROM criminals")).fetchall()}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO wanted (criminal_id, reward, last_seen, last_seen_date, status, notes)
            VALUES (:criminal_id, :reward, :last_seen, :last_seen_date, :status, :notes)
        """), {
            "criminal_id":   criminal_map.get(row["Criminal_ID"]),
            "reward":        None if pd.isna(row["Reward"]) else row["Reward"],
            "last_seen":     row["Last_Location"],
            "last_seen_date": None if pd.isna(row["Last_Seen_Date"]) else row["Last_Seen_Date"],
            "status":        "Active" if str(row["Active"]).strip().lower() == "yes" else "Inactive",
            "notes":         row["Reason"],
        })
        inserted += 1

print(f"Inserted {inserted} records into wanted table.")
