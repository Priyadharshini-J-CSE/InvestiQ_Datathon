import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/arrests.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

with engine.connect() as conn:
    criminal_map = {r[0]: r[1] for r in conn.execute(text("SELECT criminal_id, id FROM criminals")).fetchall()}
    officer_map  = {r[0]: r[1] for r in conn.execute(text("SELECT badge_number, id FROM officers")).fetchall()}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO arrests (criminal_id, officer_id, arrest_date, location)
            VALUES (:criminal_id, :officer_id, :arrest_date, :location)
        """), {
            "criminal_id": criminal_map.get(row["Criminal_ID"]),
            "officer_id":  officer_map.get(row["Arresting_Officer"]),
            "arrest_date": None if pd.isna(row["Arrest_Date"]) else row["Arrest_Date"],
            "location":    row["Arrest_Location"],
        })
        inserted += 1

print(f"Inserted {inserted} records into arrests table.")
