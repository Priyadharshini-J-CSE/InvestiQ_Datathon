import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/convictions.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

with engine.connect() as conn:
    criminal_map = {r[0]: r[1] for r in conn.execute(text("SELECT criminal_id, id FROM criminals")).fetchall()}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO convictions (criminal_id, sentence, fine, prison, conviction_date)
            VALUES (:criminal_id, :sentence, :fine, :prison, :conviction_date)
        """), {
            "criminal_id":     criminal_map.get(row["Criminal_ID"]),
            "sentence":        row["Sentence"],
            "fine":            None if pd.isna(row["Fine"]) else row["Fine"],
            "prison":          row["Prison_Term"],
            "conviction_date": None if pd.isna(row["Verdict_Date"]) else row["Verdict_Date"],
        })
        inserted += 1

print(f"Inserted {inserted} records into convictions table.")
