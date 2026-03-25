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

app = FastAPI(title="MindBridge API")

# Allow frontend to talk to backend
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
    temperature=0.2
)

# Request model
class ChatRequest(BaseModel):
    message: str

@app.get("/")
def health_check():
    return {"status": "MindBridge backend is live"}

@app.post("/chat")
def chat(request: ChatRequest):
    user_message = request.message

    # Step 1 — Retrieve relevant CBT exercises from ChromaDB
    cbt_exercises = query_knowledge_base(user_message, n_results=2)
    cbt_context = "\n".join(cbt_exercises)

    # Step 2 — Build prompt with RAG context
    system_prompt = f"""You are MindBridge, a warm and empathetic mental health first-response assistant.
    You are NOT a therapist or doctor. You do NOT diagnose conditions.
    You ONLY provide emotional support and evidence-based coping techniques.

    Always remind users that you are not a replacement for professional help.

    Here are relevant coping techniques from our knowledge base that may help:
    {cbt_context}

    Use these techniques naturally in your response. Be warm, validating and supportive.
    Keep your response concise — 3 to 5 sentences maximum."""

    # Step 3 — Get Gemini response
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message)
    ]
    response = llm.invoke(messages)

    # Step 4 — Print to console so evaluator can see RAG output
    print(f"\n--- MindBridge Debug ---")
    print(f"User: {user_message}")
    print(f"RAG Retrieved:\n{cbt_context}")
    print(f"Bot: {response.content}")

    return {
        "response": response.content,
        "rag_context": cbt_exercises
    }