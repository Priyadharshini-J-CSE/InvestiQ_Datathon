"""
SQLAlchemy ORM models for InvestiQ.
Matches every Excel file in model/data/ and the existing PostgreSQL schema.
"""

from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean,
    Date, DateTime, Numeric, ForeignKey, BigInteger
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# ─────────────────────────────────────────────────────────────────────────────
# Users
# Excel: users.xlsx  →  User_ID, Username, Password, Role, Station, Active
# ─────────────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    excel_id    = Column(String(50),  unique=True, nullable=True)   # User_ID
    username    = Column(String(50),  unique=True, nullable=False)
    password    = Column(String(255), nullable=False)
    name        = Column(String(100), nullable=False, default="")
    role        = Column(String(50),  nullable=False, default="Officer")
    badge       = Column(String(50),  nullable=True)
    station     = Column(String(100), nullable=True)                # Station
    status      = Column(String(20),  nullable=True, default="Active")  # Active
    last_login  = Column(DateTime,    nullable=True)
    created_at  = Column(DateTime,    default=datetime.utcnow)
    updated_at  = Column(DateTime,    default=datetime.utcnow, onupdate=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────────
# Districts  (lookup table, no Excel file)
# ─────────────────────────────────────────────────────────────────────────────
class District(Base):
    __tablename__ = "districts"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────────
# Police Stations  (lookup table, no Excel file)
# ─────────────────────────────────────────────────────────────────────────────
class PoliceStation(Base):
    __tablename__ = "police_stations"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(150), nullable=False)
    district   = Column(String(100), nullable=True)
    address    = Column(Text,        nullable=True)
    phone      = Column(String(20),  nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)


# ─────────────────────────────────────────────────────────────────────────────
# Persons
# Excel: persons.xlsx  →  Person_ID, Full_Name, DOB, Gender, Aadhaar,
#                          Mobile, Email, Address, District, Occupation,
#                          Nationality, Photo
# ─────────────────────────────────────────────────────────────────────────────
class Person(Base):
    __tablename__ = "persons"

    id          = Column(Integer,    primary_key=True, autoincrement=True)
    person_id   = Column(String(50), unique=True, nullable=True)   # Person_ID
    excel_id    = Column(String(50), unique=True, nullable=True)   # dedup key
    full_name   = Column(String(150), nullable=False)              # Full_Name
    gender      = Column(String(10),  nullable=True)               # Gender
    dob         = Column(Date,        nullable=True)               # DOB
    age         = Column(Integer,     nullable=True)
    phone       = Column(String(20),  nullable=True)               # Mobile
    email       = Column(String(100), nullable=True)               # Email
    occupation  = Column(String(100), nullable=True)               # Occupation
    nationality = Column(String(50),  nullable=True, default="Indian")  # Nationality
    address     = Column(Text,        nullable=True)               # Address
    aadhaar     = Column(String(20),  nullable=True)               # Aadhaar
    photo_url   = Column(Text,        nullable=True)               # Photo
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    criminals   = relationship("Criminal", back_populates="person",
                               foreign_keys="Criminal.person_id")


# ─────────────────────────────────────────────────────────────────────────────
# Officers
# Excel: officers.xlsx  →  Officer_ID, Name, Rank, Station, District,
#                           Mobile, Email
# ─────────────────────────────────────────────────────────────────────────────
class Officer(Base):
    __tablename__ = "officers"

    id           = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id     = Column(String(50), unique=True, nullable=True)  # Officer_ID
    badge_number = Column(String(50), unique=True, nullable=False) # Officer_ID reused as badge
    name         = Column(String(100), nullable=False)             # Name
    rank         = Column(String(50),  nullable=True)              # Rank
    station_id   = Column(Integer, ForeignKey("police_stations.id"), nullable=True)
    district     = Column(String(100), nullable=True)              # District
    phone        = Column(String(20),  nullable=True)              # Mobile
    email        = Column(String(100), nullable=True)              # Email
    joining_date = Column(Date,        nullable=True)
    status       = Column(String(20),  nullable=True, default="Active")
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by   = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by  = Column(Integer, ForeignKey("users.id"), nullable=True)

    station      = relationship("PoliceStation", foreign_keys=[station_id])


# ─────────────────────────────────────────────────────────────────────────────
# Criminals
# Excel: criminals.xlsx  →  Criminal_ID, Person_ID, Alias, Gang_Name,
#                            Fingerprint_ID, DNA_ID, Risk_Level,
#                            Previous_Cases, Arrest_Count, Repeat_Offender,
#                            Bail_Status, Current_Status, Wanted_Status
# ─────────────────────────────────────────────────────────────────────────────
class Criminal(Base):
    __tablename__ = "criminals"

    id              = Column(Integer,    primary_key=True, autoincrement=True)
    criminal_id     = Column(String(50), unique=True, nullable=True)  # Criminal_ID
    excel_id        = Column(String(50), unique=True, nullable=True)  # dedup key
    person_id       = Column(Integer, ForeignKey("persons.id"), nullable=True)
    name            = Column(String(150), nullable=False, default="")
    alias           = Column(String(100), nullable=True)              # Alias
    gender          = Column(String(10),  nullable=True)
    age             = Column(Integer,     nullable=True)
    address         = Column(Text,        nullable=True)
    fingerprint_id  = Column(String(100), nullable=True)              # Fingerprint_ID
    dna_id          = Column(String(100), nullable=True)              # DNA_ID
    risk_level      = Column(String(20),  nullable=True, default="Low")  # Risk_Level
    gang            = Column(String(100), nullable=True)              # Gang_Name
    crime_category  = Column(String(100), nullable=True)
    repeat_offender = Column(Boolean,     nullable=True, default=False)  # Repeat_Offender
    bail_status     = Column(String(50),  nullable=True)              # Bail_Status
    status          = Column(String(50),  nullable=True, default="Active")  # Current_Status
    wanted_status   = Column(String(10),  nullable=True, default="No")     # Wanted_Status
    notes           = Column(Text,        nullable=True)
    photo_url       = Column(Text,        nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by      = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by     = Column(Integer, ForeignKey("users.id"), nullable=True)

    person          = relationship("Person", back_populates="criminals",
                                   foreign_keys=[person_id])


# ─────────────────────────────────────────────────────────────────────────────
# FIRs
# Excel: fir.xlsx  →  FIR_ID, FIR_Number, Case_Number, FIR_Date, FIR_Time,
#                      Incident_Date, Incident_Time, Police_Station, District,
#                      Crime_Category, Crime_Type, IPC_Sections, Description,
#                      Victim_ID, Criminal_ID, Officer_ID, Evidence_ID,
#                      Investigation_Status, Chargesheet_Status,
#                      Court_Case_ID, Latitude, Longitude
# ─────────────────────────────────────────────────────────────────────────────
class FIR(Base):
    __tablename__ = "firs"

    id                 = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id           = Column(String(50), unique=True, nullable=True)  # FIR_ID
    fir_number         = Column(String(50), unique=True, nullable=False) # FIR_Number
    station_id         = Column(Integer, ForeignKey("police_stations.id"), nullable=True)
    district           = Column(String(100), nullable=True)              # District
    date               = Column(Date,        nullable=False)             # FIR_Date
    fir_time           = Column(String(10),  nullable=True)              # FIR_Time
    incident_date      = Column(Date,        nullable=True)              # Incident_Date
    incident_time      = Column(String(10),  nullable=True)              # Incident_Time
    police_station     = Column(String(150), nullable=True)              # Police_Station (raw text)
    crime_category     = Column(String(100), nullable=True)              # Crime_Category
    crime_type         = Column(String(100), nullable=True)              # Crime_Type
    ipc_sections       = Column(Text,        nullable=True)              # IPC_Sections
    description        = Column(Text,        nullable=True)              # Description
    complainant        = Column(String(150), nullable=True)
    victim             = Column(String(150), nullable=True)              # Victim_ID (raw)
    accused            = Column(String(150), nullable=True)              # Criminal_ID (raw)
    officer_id         = Column(Integer, ForeignKey("officers.id"), nullable=True)
    status             = Column(String(50),  nullable=True, default="Open")  # Investigation_Status
    chargesheet_status = Column(String(50),  nullable=True)              # Chargesheet_Status
    case_number_ref    = Column(String(50),  nullable=True)              # Court_Case_ID
    latitude           = Column(Numeric(10, 6), nullable=True)           # Latitude
    longitude          = Column(Numeric(10, 6), nullable=True)           # Longitude
    attachment_url     = Column(Text,        nullable=True)
    created_at         = Column(DateTime, default=datetime.utcnow)
    updated_at         = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by         = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by        = Column(Integer, ForeignKey("users.id"), nullable=True)

    officer            = relationship("Officer", foreign_keys=[officer_id])


# ─────────────────────────────────────────────────────────────────────────────
# Cases
# Excel: cases.xlsx  →  Case_ID, FIR_ID, Court_Name, Judge,
#                        Hearing_Date, Status, Verdict
# ─────────────────────────────────────────────────────────────────────────────
class Case(Base):
    __tablename__ = "cases"

    id                   = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id             = Column(String(50), unique=True, nullable=True)  # Case_ID
    case_number          = Column(String(50), unique=True, nullable=False) # Case_ID reused
    fir_id               = Column(Integer, ForeignKey("firs.id"), nullable=True)
    court                = Column(String(150), nullable=True)              # Court_Name
    judge                = Column(String(100), nullable=True)              # Judge
    officer_id           = Column(Integer, ForeignKey("officers.id"), nullable=True)
    status               = Column(String(50),  nullable=True, default="Open")  # Status
    verdict              = Column(String(100), nullable=True)              # Verdict
    investigation_status = Column(String(50),  nullable=True, default="Ongoing")
    court_date           = Column(Date,        nullable=True)              # Hearing_Date
    closing_date         = Column(Date,        nullable=True)
    notes                = Column(Text,        nullable=True)
    created_at           = Column(DateTime, default=datetime.utcnow)
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by           = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by          = Column(Integer, ForeignKey("users.id"), nullable=True)

    fir                  = relationship("FIR", foreign_keys=[fir_id])


# ─────────────────────────────────────────────────────────────────────────────
# Charges
# Excel: charges.xlsx  →  Charge_ID, Criminal_ID, FIR_ID, IPC,
#                          Section_Name, Severity
# ─────────────────────────────────────────────────────────────────────────────
class Charge(Base):
    __tablename__ = "charges"

    id          = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id    = Column(String(50), unique=True, nullable=True)  # Charge_ID
    case_id     = Column(Integer, ForeignKey("cases.id"),    nullable=True)
    criminal_id = Column(Integer, ForeignKey("criminals.id"), nullable=True)
    ipc_section = Column(String(100), nullable=True)              # IPC
    description = Column(Text,        nullable=True)              # Section_Name
    severity    = Column(String(50),  nullable=True)              # Severity
    filed_date  = Column(Date,        nullable=True)
    status      = Column(String(50),  nullable=True, default="Pending")
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    case        = relationship("Case",     foreign_keys=[case_id])
    criminal    = relationship("Criminal", foreign_keys=[criminal_id])


# ─────────────────────────────────────────────────────────────────────────────
# Arrests
# Excel: arrests.xlsx  →  Arrest_ID, Criminal_ID, FIR_ID,
#                          Arrest_Date, Arrest_Location, Arresting_Officer
# ─────────────────────────────────────────────────────────────────────────────
class Arrest(Base):
    __tablename__ = "arrests"

    id             = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id       = Column(String(50), unique=True, nullable=True)  # Arrest_ID
    criminal_id    = Column(Integer, ForeignKey("criminals.id"), nullable=True)
    officer_id     = Column(Integer, ForeignKey("officers.id"),  nullable=True)
    fir_excel_ref  = Column(String(50), nullable=True)              # FIR_ID (raw ref)
    arrest_date    = Column(Date,        nullable=False)             # Arrest_Date
    location       = Column(String(200), nullable=True)             # Arrest_Location
    reason         = Column(Text,        nullable=True)
    bail_status    = Column(String(50),  nullable=True, default="Not Applied")
    custody_status = Column(String(50),  nullable=True, default="In Custody")
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by    = Column(Integer, ForeignKey("users.id"), nullable=True)

    criminal       = relationship("Criminal", foreign_keys=[criminal_id])
    officer        = relationship("Officer",  foreign_keys=[officer_id])


# ─────────────────────────────────────────────────────────────────────────────
# Convictions
# Excel: convictions.xlsx  →  Conviction_ID, Criminal_ID, Sentence,
#                              Fine, Prison_Term, Verdict_Date
# ─────────────────────────────────────────────────────────────────────────────
class Conviction(Base):
    __tablename__ = "convictions"

    id              = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id        = Column(String(50), unique=True, nullable=True)  # Conviction_ID
    case_id         = Column(Integer, ForeignKey("cases.id"),    nullable=True)
    criminal_id     = Column(Integer, ForeignKey("criminals.id"), nullable=True)
    court           = Column(String(150), nullable=True)
    judge           = Column(String(100), nullable=True)
    sentence        = Column(Text,        nullable=True)              # Sentence
    fine            = Column(Numeric(12, 2), nullable=True)           # Fine
    prison          = Column(String(150), nullable=True)              # Prison_Term
    conviction_date = Column(Date,        nullable=True)              # Verdict_Date
    release_date    = Column(Date,        nullable=True)
    appeal_status   = Column(String(50),  nullable=True, default="None")
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by      = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by     = Column(Integer, ForeignKey("users.id"), nullable=True)

    case            = relationship("Case",     foreign_keys=[case_id])
    criminal        = relationship("Criminal", foreign_keys=[criminal_id])


# ─────────────────────────────────────────────────────────────────────────────
# Evidence
# Excel: evidence.xlsx  →  Evidence_ID, FIR_ID, Type, Description,
#                           File_Name, Uploaded_By
# ─────────────────────────────────────────────────────────────────────────────
class Evidence(Base):
    __tablename__ = "evidence"

    id               = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id         = Column(String(50), unique=True, nullable=True)  # Evidence_ID
    case_id          = Column(Integer, ForeignKey("cases.id"),    nullable=True)
    fir_excel_ref    = Column(String(50), nullable=True)              # FIR_ID (raw ref)
    evidence_type    = Column(String(50),  nullable=True)             # Type
    description      = Column(Text,        nullable=True)             # Description
    collected_by     = Column(Integer, ForeignKey("officers.id"), nullable=True)  # Uploaded_By
    collected_date   = Column(Date,        nullable=True)
    location         = Column(String(200), nullable=True)
    storage_location = Column(String(200), nullable=True)
    file_url         = Column(Text,        nullable=True)             # File_Name
    status           = Column(String(50),  nullable=True, default="Active")
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by       = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by      = Column(Integer, ForeignKey("users.id"), nullable=True)

    officer          = relationship("Officer", foreign_keys=[collected_by])


# ─────────────────────────────────────────────────────────────────────────────
# Wanted
# Excel: wanted.xlsx  →  Wanted_ID, Criminal_ID, Reward, Last_Seen_Date,
#                         Last_Location, Reason, Issued_By, Active
# ─────────────────────────────────────────────────────────────────────────────
class Wanted(Base):
    __tablename__ = "wanted"

    id            = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id      = Column(String(50), unique=True, nullable=True)  # Wanted_ID
    criminal_id   = Column(Integer, ForeignKey("criminals.id"), nullable=True)
    reward        = Column(Numeric(12, 2), nullable=True)           # Reward
    declared_date = Column(Date,        nullable=True)              # Last_Seen_Date used as declared
    priority      = Column(String(20),  nullable=True, default="Medium")
    last_seen     = Column(String(200), nullable=True)              # Last_Location
    last_seen_date= Column(Date,        nullable=True)              # Last_Seen_Date
    reason        = Column(Text,        nullable=True)              # Reason
    issued_by_ref = Column(String(50),  nullable=True)              # Issued_By (raw Officer_ID)
    status        = Column(String(50),  nullable=True, default="Active")  # Active → Active/Inactive
    notes         = Column(Text,        nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by    = Column(Integer, ForeignKey("users.id"), nullable=True)
    modified_by   = Column(Integer, ForeignKey("users.id"), nullable=True)

    criminal      = relationship("Criminal", foreign_keys=[criminal_id])


# ─────────────────────────────────────────────────────────────────────────────
# Warrants
# Excel: warrants.xlsx  →  Warrant_ID, Criminal_ID, Type,
#                           Issue_Date, Expiry_Date, Status
# ─────────────────────────────────────────────────────────────────────────────
class Warrant(Base):
    __tablename__ = "warrants"

    id           = Column(Integer,    primary_key=True, autoincrement=True)
    excel_id     = Column(String(50), unique=True, nullable=True)  # Warrant_ID
    criminal_id  = Column(Integer, ForeignKey("criminals.id"), nullable=True)
    warrant_type = Column(String(100), nullable=True)              # Type
    issue_date   = Column(Date,        nullable=True)              # Issue_Date
    expiry_date  = Column(Date,        nullable=True)              # Expiry_Date
    status       = Column(String(50),  nullable=True, default="Active")  # Status
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    criminal     = relationship("Criminal", foreign_keys=[criminal_id])


# ─────────────────────────────────────────────────────────────────────────────
# Audit Logs  (system table, no Excel file)
# ─────────────────────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id         = Column(Integer,    primary_key=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    action     = Column(String(100), nullable=True)
    table_name = Column(String(100), nullable=True)
    record_id  = Column(Integer,     nullable=True)
    ip_address = Column(String(50),  nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────────
# Activity Logs  (system table, no Excel file)
# ─────────────────────────────────────────────────────────────────────────────
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id          = Column(Integer,    primary_key=True, autoincrement=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text,       nullable=True)
    module      = Column(String(100), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
