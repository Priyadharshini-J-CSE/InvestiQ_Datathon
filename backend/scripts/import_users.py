import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/users.xlsx"

df = pd.read_excel(EXCEL_PATH)

# Map Excel columns to DB columns
df = df.rename(columns={
    "Username": "username",
    "Password": "password",
    "Role":     "role",
})

# name is NOT NULL — default to username
df["name"] = df["username"]

engine = get_engine()
inserted = 0

with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO users (username, password, role, name)
            VALUES (:username, :password, :role, :name)
            ON CONFLICT (username) DO NOTHING
        """), {"username": row["username"], "password": row["password"],
               "role": row["role"], "name": row["name"]})
        inserted += 1

print(f"Inserted {inserted} records into users table.")
