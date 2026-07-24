import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/fir.xlsx"

df = pd.read_excel(EXCEL_PATH)

engine = get_engine()

# Build Officer_ID (badge_number) -> officers.id lookup
with engine.connect() as conn:
    rows = conn.execute(text("SELECT badge_number, id FROM officers")).fetchall()
officer_map = {r[0]: r[1] for r in rows}

inserted = 0
with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO firs (fir_number, district, date, crime_type, ipc_sections,
                              description, victim, accused, officer_id, status)
            VALUES (:fir_number, :district, :date, :crime_type, :ipc_sections,
                    :description, :victim, :accused, :officer_id, :status)
            ON CONFLICT (fir_number) DO NOTHING
        """), {
            "fir_number":   row["FIR_Number"],
            "district":     row["District"],
            "date":         None if pd.isna(row["FIR_Date"]) else row["FIR_Date"],
            "crime_type":   row["Crime_Type"],
            "ipc_sections": row["IPC_Sections"],
            "description":  row["Description"],
            "victim":       row["Victim_ID"],
            "accused":      row["Criminal_ID"],
            "officer_id":   officer_map.get(row["Officer_ID"]),
            "status":       row["Investigation_Status"],
        })
        inserted += 1

print(f"Inserted {inserted} records into firs table.")
