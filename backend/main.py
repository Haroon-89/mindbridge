from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import sys, os, logging, json, asyncio, uuid
from datetime import datetime
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

from rag.ingest import query_knowledge_base
from sentiment.classifier import analyze_sentiment
from sentiment.crisis_handler import get_crisis_response
from memory.session_memory import add_to_memory, get_chat_history
from services.twilio_service import send_crisis_sms
from services.cbt_module import get_module_instruction
from services.auth import register_user, login_user, get_current_user
from db.database import get_db, create_tables, Conversation, CrisisEvent

logging.basicConfig(
    filename="mindbridge_debug.log",
    level=logging.INFO,
    format="%(asctime)s - %(message)s"
)

# Create DB tables on startup
create_tables()

# Warm up ChromaDB and sentence-transformers on startup so first request is fast
import threading
def _warmup():
    try:
        query_knowledge_base("hello", n_results=1)
        print("ChromaDB warmed up.")
    except Exception as e:
        print(f"Warmup warning: {e}")
threading.Thread(target=_warmup, daemon=True).start()

app = FastAPI(title="MindBridge API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.7,
)


# ── Pydantic models ──────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str = ""
    emergency_contact: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    session_id: str = "anonymous"
    user_name: str = "Friend"

class ClearSessionRequest(BaseModel):
    session_id: str


# ── Helpers ──────────────────────────────────────────────────
def build_system_prompt(mood_label, crisis_tier, chat_history, cbt_module_instruction, cbt_context):
    tier_instruction = ""
    if crisis_tier == 2:
        tier_instruction = """
IMPORTANT: User is in elevated distress.
Be extra warm and gentle.
At the end of your response naturally include:
'If things feel too heavy, please reach out to iCall at 9152987821 or
Vandrevala Foundation at 1860-2662-345. You deserve support.'
"""
    elif crisis_tier == 1:
        tier_instruction = """
User is showing mild distress.
Be empathetic and validating BEFORE suggesting any technique.
Never jump straight to advice without first acknowledging feelings.
"""

    return f"""You are MindBridge, a warm, empathetic mental health first-response assistant
supporting university students during difficult times.

STRICT RULES - NEVER BREAK THESE:
1. NEVER diagnose any mental health condition
2. NEVER suggest any medication or medical treatment
3. NEVER claim to be a therapist or replace professional help
4. ALWAYS remind the user you are a support tool, not a professional
5. NEVER use clinical labels like 'you have anxiety disorder'
6. ALWAYS validate feelings before offering techniques
7. Keep responses warm, human, and conversational - NOT clinical
8. NEVER use em dashes or en dashes. Use commas or plain sentences instead.
9. Write like a caring human friend, not like an AI report. No bullet points, no dashes, no formal structure.

{tier_instruction}

CONVERSATION HISTORY:
{chat_history if chat_history else "This is the start of the conversation."}

MOOD BASED CBT MODULE:
{cbt_module_instruction}

ADDITIONAL TECHNIQUES FROM KNOWLEDGE BASE:
{cbt_context}

Respond in 3 to 5 sentences maximum.
Be warm, validating and supportive.
Use CBT techniques naturally, woven into normal sentences."""


def clean_response(text: str) -> str:
    text = text.replace("\u2014", ",").replace("\u2013", ",")
    text = text.replace(" - ", ", ")
    return text.strip()


def save_message(db: Session, user_id: str, session_id: str, role: str,
                 message: str, mood_label: str = None, crisis_tier: int = 0):
    record = Conversation(
        id=str(uuid.uuid4()),
        user_id=user_id,
        session_id=session_id,
        role=role,
        message=message,
        mood_label=mood_label,
        crisis_tier=crisis_tier,
        timestamp=datetime.utcnow()
    )
    db.add(record)
    db.commit()


def save_crisis_event(db: Session, user_id: str, session_id: str,
                      tier: int, message: str, sms_sent: bool, sms_target: str):
    record = CrisisEvent(
        id=str(uuid.uuid4()),
        user_id=user_id,
        session_id=session_id,
        tier=tier,
        message=message,
        sms_sent=str(sms_sent).lower(),
        sms_target=sms_target,
        timestamp=datetime.utcnow()
    )
    db.add(record)
    db.commit()


# ── Auth endpoints ────────────────────────────────────────────
@app.post("/auth/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(
        db, request.name, request.email, request.password,
        request.phone, request.emergency_contact
    )
    return {"message": "Account created successfully.", "user_id": user.id, "name": user.name}


@app.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user, token = login_user(db, request.email, request.password)
    return {
        "token": token,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "emergency_contact": user.emergency_contact or ""
    }


@app.post("/auth/update-contact")
def update_contact(payload: dict, authorization: str = Header(None), db: Session = Depends(get_db)):
    user = get_current_user(db, authorization)
    user.emergency_contact = payload.get("emergency_contact", "").strip()
    db.commit()
    # Update stored user data
    stored = json.loads(json.dumps({"emergency_contact": user.emergency_contact}))
    return {"message": "Emergency contact updated.", "emergency_contact": user.emergency_contact}


@app.get("/auth/me")
def me(authorization: str = Header(None), db: Session = Depends(get_db)):
    user = get_current_user(db, authorization)
    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone or "",
        "emergency_contact": user.emergency_contact or ""
    }


# ── Health endpoints ──────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "MindBridge backend is live", "timestamp": datetime.now().isoformat()}


@app.get("/health")
def detailed_health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ── Chat stream endpoint ──────────────────────────────────────
@app.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user_message = request.message
    session_id   = request.session_id
    user_name    = request.user_name

    # Get logged-in user if token provided (optional - works without login too)
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        try:
            current_user = get_current_user(db, authorization)
            user_name = current_user.name
        except Exception:
            pass

    chat_history, sentiment_result, cbt_exercises = await asyncio.gather(
        asyncio.to_thread(get_chat_history, session_id),
        asyncio.to_thread(analyze_sentiment, user_message),
        asyncio.to_thread(query_knowledge_base, user_message, 2),
    )

    crisis_tier   = sentiment_result["crisis_tier"]
    crisis_response = get_crisis_response(crisis_tier)
    mood_label    = sentiment_result["mood_label"]
    cbt_module_instruction = get_module_instruction(mood_label)
    cbt_context   = "\n".join(cbt_exercises)

    logging.info(f"STREAM | Session: {session_id} | Mood: {mood_label} | Tier: {crisis_tier}")

    # Save user message to DB (fire and forget, don't await)
    if current_user:
        asyncio.create_task(asyncio.to_thread(
            save_message, db, current_user.id, session_id,
            "user", user_message, mood_label, crisis_tier
        ))

    # Tier 3 - use user's personal emergency contact if available
    if crisis_response["bypass_llm"]:
        emergency_number = None
        if current_user and current_user.emergency_contact and current_user.emergency_contact.strip():
            emergency_number = current_user.emergency_contact.strip()
            print(f"TIER 3: Using user's emergency contact: {emergency_number}")
        else:
            print(f"TIER 3: No user emergency contact set, using .env fallback")
            emergency_number = None

        sms_result = await asyncio.to_thread(send_crisis_sms, user_name, emergency_number)
        logging.info(f"TIER 3 | User: {current_user.id if current_user else 'anon'} | SMS: {sms_result['success']}")

        if current_user:
            asyncio.create_task(asyncio.to_thread(
                save_crisis_event, db, current_user.id, session_id,
                crisis_tier, user_message, sms_result["success"], emergency_number
            ))

        async def crisis_generator():
            payload = {
                "type": "crisis",
                "message": crisis_response["message"],
                "crisis_tier": crisis_tier,
                "emergency_resources": crisis_response["emergency_resources"],
                "sms_sent": sms_result["success"]
            }
            yield f"data: {json.dumps(payload)}\n\n"

        return StreamingResponse(
            crisis_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
        )

    system_prompt = build_system_prompt(mood_label, crisis_tier, chat_history, cbt_module_instruction, cbt_context)

    llm_messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_message)]
    raw_response = await asyncio.to_thread(lambda: llm.invoke(llm_messages).content)
    full_response = clean_response(raw_response)

    # Save to memory and DB in parallel, don't block the response
    async def post_response_tasks():
        await asyncio.gather(
            asyncio.to_thread(add_to_memory, session_id, user_message, full_response),
            asyncio.to_thread(save_message, db, current_user.id, session_id, "bot", full_response, mood_label, crisis_tier)
            if current_user else asyncio.to_thread(add_to_memory, session_id, user_message, full_response)
        )
    asyncio.create_task(post_response_tasks())

    logging.info(f"Stream complete | Session: {session_id} | Length: {len(full_response)}")

    def generate():
        metadata = {
            "type": "metadata",
            "sentiment": sentiment_result,
            "crisis_tier": crisis_tier,
            "emergency_resources": crisis_response["emergency_resources"],
            "sms_sent": False
        }
        yield f"data: {json.dumps(metadata)}\n\n"

        chunk_size = 3
        for i in range(0, len(full_response), chunk_size):
            token = full_response[i:i + chunk_size]
            yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


# ── Conversation history endpoint ─────────────────────────────
@app.get("/conversations")
def get_conversations(authorization: str = Header(None), db: Session = Depends(get_db)):
    user = get_current_user(db, authorization)
    records = db.query(Conversation).filter(
        Conversation.user_id == user.id
    ).order_by(Conversation.timestamp).all()
    return [
        {
            "role": r.role,
            "message": r.message,
            "mood_label": r.mood_label,
            "crisis_tier": r.crisis_tier,
            "timestamp": r.timestamp.isoformat(),
            "session_id": r.session_id
        }
        for r in records
    ]


@app.post("/clear-session")
def clear_session(request: ClearSessionRequest):
    try:
        from memory.session_memory import clear_session as cs
        cs(request.session_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
