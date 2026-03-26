from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.ingest import query_knowledge_base
from sentiment.classifier import analyze_sentiment
from sentiment.crisis_handler import get_crisis_response

app = FastAPI(title="MindBridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.7
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "anonymous"

@app.get("/")
def health_check():
    return {"status": "MindBridge backend is live"}

@app.post("/chat")
def chat(request: ChatRequest):
    user_message = request.message

    # Step 1 — Run sentiment and crisis detection FIRST
    sentiment_result = analyze_sentiment(user_message)
    crisis_tier = sentiment_result["crisis_tier"]
    crisis_response = get_crisis_response(crisis_tier)

    print(f"\n--- MindBridge Pipeline ---")
    print(f"User: {user_message}")
    print(f"Mood: {sentiment_result['mood_label']} | Tier: {crisis_tier} | Confidence: {sentiment_result['confidence']}")
    print(f"Action: {crisis_response['action']}")

    # Step 2 — Tier 3 BYPASSES LLM completely
    if crisis_response["bypass_llm"]:
        print("TIER 3 DETECTED — Bypassing LLM, returning emergency resources")
        return {
            "response": crisis_response["message"],
            "emergency_resources": crisis_response["emergency_resources"],
            "sentiment": sentiment_result,
            "crisis_tier": crisis_tier,
            "llm_used": False
        }

    # Step 3 — Retrieve CBT exercises from ChromaDB
    cbt_exercises = query_knowledge_base(user_message, n_results=2)
    cbt_context = "\n".join(cbt_exercises)

    # Step 4 — Build system prompt based on tier
    tier_instruction = ""
    if crisis_tier == 2:
        tier_instruction = """
The user seems to be in elevated distress. 
Be extra warm and gentle. 
At the end of your response always include:
'If things feel too heavy, please reach out to iCall at 9152987821 or Vandrevala Foundation at 1860-2662-345.'
"""
    elif crisis_tier == 1:
        tier_instruction = """
The user is showing mild distress.
Be empathetic and validating before suggesting any techniques.
"""

    system_prompt = f"""You are MindBridge, a warm and empathetic mental health first-response assistant.
You are NOT a therapist or doctor. You do NOT diagnose conditions.
You ONLY provide emotional support and evidence-based coping techniques.
Always remind users you are not a replacement for professional help.

{tier_instruction}

Relevant coping techniques from our knowledge base:
{cbt_context}

Use these techniques naturally in your response.
Be warm, validating and supportive.
Keep response to 3 to 5 sentences maximum.
Never use clinical labels or diagnose anything."""

    # Step 5 — Get Gemini response
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message)
    ]
    response = llm.invoke(messages)

    print(f"Bot: {response.content[:100]}...")
    print(f"---------------------------\n")

    return {
        "response": response.content,
        "emergency_resources": crisis_response["emergency_resources"],
        "sentiment": sentiment_result,
        "crisis_tier": crisis_tier,
        "llm_used": True
    }