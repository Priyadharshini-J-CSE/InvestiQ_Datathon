import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/criminals.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

# Build Person_ID -> persons.id lookup
with engine.connect() as conn:
    rows = conn.execute(text("SELECT person_id, id FROM persons")).fetchall()
person_map = {r[0]: r[1] for r in rows}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO criminals (criminal_id, person_id, alias, fingerprint_id, dna_id,
                                   risk_level, gang, repeat_offender, status, name)
            VALUES (:criminal_id, :person_id, :alias, :fingerprint_id, :dna_id,
                    :risk_level, :gang, :repeat_offender, :status, :name)
            ON CONFLICT (criminal_id) DO NOTHING
        """), {
            "criminal_id":    row["Criminal_ID"],
            "person_id":      person_map.get(row["Person_ID"]),
            "alias":          row["Alias"],
            "fingerprint_id": row["Fingerprint_ID"],
            "dna_id":         row["DNA_ID"],
            "risk_level":     row["Risk_Level"],
            "gang":           row["Gang_Name"],
            "repeat_offender": str(row["Repeat_Offender"]).strip().lower() in ("yes", "true", "1"),
            "status":         row["Current_Status"],
            "name":           row["Criminal_ID"],  # no Name column, use ID as placeholder
        })
        inserted += 1

print(f"Inserted {inserted} records into criminals table.")
