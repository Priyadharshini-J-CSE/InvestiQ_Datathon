import pandas as pd
from sqlalchemy import text
from db import get_engine

EXCEL_PATH = "../../model/data/persons.xlsx"

df = pd.read_excel(EXCEL_PATH)

df = df.rename(columns={
    "Person_ID":   "person_id",
    "Full_Name":   "full_name",
    "DOB":         "dob",
    "Gender":      "gender",
    "Aadhaar":     "aadhaar",
    "Mobile":      "phone",
    "Email":       "email",
    "Address":     "address",
    "Occupation":  "occupation",
    "Nationality": "nationality",
    "Photo":       "photo_url",
})

engine = get_engine()
inserted = 0

with engine.begin() as conn:
    for _, row in df.iterrows():
        conn.execute(text("""
            INSERT INTO persons (person_id, full_name, dob, gender, aadhaar, phone, email, address, occupation, nationality, photo_url)
            VALUES (:person_id, :full_name, :dob, :gender, :aadhaar, :phone, :email, :address, :occupation, :nationality, :photo_url)
            ON CONFLICT (person_id) DO NOTHING
        """), {
            "person_id":   row["person_id"],
            "full_name":   row["full_name"],
            "dob":         None if pd.isna(row["dob"]) else row["dob"],
            "gender":      row["gender"],
            "aadhaar":     str(row["aadhaar"]),
            "phone":       str(row["phone"]),
            "email":       row["email"],
            "address":     row["address"],
            "occupation":  row["occupation"],
            "nationality": row["nationality"],
            "photo_url":   row["photo_url"],
        })
        inserted += 1

print(f"Inserted {inserted} records into persons table.")
