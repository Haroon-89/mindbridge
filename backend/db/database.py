from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id          = Column(String, primary_key=True)
    name        = Column(String(100), nullable=False)
    email       = Column(String(200), unique=True, nullable=False)
    password    = Column(String(200), nullable=False)          # bcrypt hash
    phone       = Column(String(20), nullable=True)            # user's own phone
    emergency_contact = Column(String(20), nullable=True)      # contact to SMS on tier 3
    created_at  = Column(DateTime, nullable=False)


class Conversation(Base):
    __tablename__ = "conversations"

    id          = Column(String, primary_key=True)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    session_id  = Column(String, nullable=False)
    role        = Column(String(10), nullable=False)           # 'user' or 'bot'
    message     = Column(Text, nullable=False)
    mood_label  = Column(String(20), nullable=True)
    crisis_tier = Column(Integer, default=0)
    timestamp   = Column(DateTime, nullable=False)


class CrisisEvent(Base):
    __tablename__ = "crisis_events"

    id          = Column(String, primary_key=True)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    session_id  = Column(String, nullable=False)
    tier        = Column(Integer, nullable=False)
    message     = Column(Text, nullable=False)                 # exact message that triggered it
    sms_sent    = Column(String(5), default="false")
    sms_target  = Column(String(20), nullable=True)            # which number was SMSed
    timestamp   = Column(DateTime, nullable=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_tables()
    print("Tables created successfully!")
