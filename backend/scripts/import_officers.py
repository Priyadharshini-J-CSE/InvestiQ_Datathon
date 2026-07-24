import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/officers.xlsx"

df = pd.read_excel(EXCEL_PATH)

df = df.rename(columns={
    "Officer_ID": "badge_number",
    "Name":       "name",
    "Rank":       "rank",
    "District":   "district",
    "Mobile":     "phone",
    "Email":      "email",
})

engine = get_engine()
inserted = 0

with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO officers (badge_number, name, rank, district, phone, email)
            VALUES (:badge_number, :name, :rank, :district, :phone, :email)
            ON CONFLICT (badge_number) DO NOTHING
        """), {
            "badge_number": row["badge_number"],
            "name":         row["name"],
            "rank":         row["rank"],
            "district":     row["district"],
            "phone":        str(row["phone"]),
            "email":        row["email"],
        })
        inserted += 1

print(f"Inserted {inserted} records into officers table.")
