from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Sessions Table
class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(String, primary_key=True)
    created_at = Column(DateTime, nullable=False)
    last_active = Column(DateTime, nullable=False)
    session_data = Column(JSON)
    crisis_tier_reached = Column(Integer, default=0)

# Mood Logs Table
class MoodLog(Base):
    __tablename__ = "mood_logs"

    log_id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False)
    logged_at = Column(DateTime, nullable=False)
    mood_label = Column(String(20), nullable=False)
    sentiment_score = Column(Float, nullable=False)
    crisis_tier = Column(Integer, default=0)

def create_tables():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    print("Tables created successfully!")