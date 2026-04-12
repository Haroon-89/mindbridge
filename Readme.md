# MindBridge

MindBridge is a mental health first-response chatbot built for university students. It detects emotional distress in real time using a fine-tuned DistilBERT model, responds with empathetic CBT-based coping techniques via Google Gemini, and escalates to emergency contacts when a crisis is detected.
\n
## Project Overview

University students often face anxiety, depression, and emotional crises without immediate access to professional support. MindBridge acts as a first-response tool that listens, validates feelings, and guides users through evidence-based coping techniques. It is not a replacement for professional mental health care.
\n
## Features

- Real-time sentiment analysis using DistilBERT fine-tuned on emotion detection
- Three-tier crisis escalation system
  - Tier 0: Normal conversation with CBT-based responses
  - Tier 1: Mild distress, empathetic validation before any technique
  - Tier 2: Elevated distress, hotline numbers shown automatically
  - Tier 3: Severe crisis, LLM bypassed, emergency SMS sent immediately
- Retrieval-Augmented Generation using ChromaDB and sentence-transformers
- Mood-specific CBT modules triggered per detected emotion
- Streaming responses with typewriter effect using Server-Sent Events
- User authentication with JWT tokens and bcrypt password hashing
- Full conversation history stored in PostgreSQL per user
- Crisis events logged with timestamp, message, and SMS delivery status
- Personal emergency contact stored per user, used for Tier 3 SMS alerts
- Mood garden dashboard where each conversation grows an animated SVG plant based on detected mood (sunflower for hopeful, bamboo for neutral, wheat for anxious, blossom for sad, lavender for distressed)
- Light and dark mode with calming green and purple-blue themes; auto-detects OS/browser preference on first load, with a manual toggle inside the profile dropdown
- Mobile responsive design
\n
## Tech Stack

### Backend
- FastAPI
- PostgreSQL with SQLAlchemy ORM
- DistilBERT via HuggingFace Transformers for sentiment classification
- Google Gemini 2.5 Flash via LangChain for response generation
- ChromaDB with sentence-transformers for RAG knowledge base
- Twilio for emergency SMS
- bcrypt and PyJWT for authentication
- LangChain memory for in-session conversation context

### Frontend
- React 19 with Vite
- Plain CSS with CSS variables for theming
- Fetch API with ReadableStream for SSE streaming
- Animated SVG mood garden with per-mood plant types, butterflies, birds, and dragonflies, no external chart libraries
\n
## Project Structure

```
mental_health_chatbot/
├── backend/
│   ├── db/
│   │   └── database.py          # SQLAlchemy models: User, Conversation, CrisisEvent
│   ├── memory/
│   │   └── session_memory.py    # LangChain in-session conversation memory
│   ├── rag/
│   │   └── chroma_db/           # Persisted ChromaDB vector store
│   ├── sentiment/
│   │   ├── classifier.py        # DistilBERT emotion classifier + crisis tier logic
│   │   └── crisis_handler.py    # Tier response messages and routing
│   ├── services/
│   │   ├── auth.py              # JWT auth, bcrypt hashing, user helpers
│   │   ├── cbt_module.py        # Mood-specific CBT technique modules
│   │   └── twilio_service.py    # Emergency SMS via Twilio
│   ├── tests/
│   │   └── test_crisis_detection.py  # CLPsych-inspired evaluation suite
│   ├── main.py                  # FastAPI app, all endpoints
│   └── requirements.txt
├── rag/
│   ├── cbt_data.py              # CBT knowledge base documents
│   └── ingest.py                # ChromaDB ingestion and query functions
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.jsx     # Login and signup page
│   │   │   ├── AuthPage.css
│   │   │   ├── ChatWindow.jsx   # Main chat interface with SSE streaming
│   │   │   ├── ChatWindow.css
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── MessageBubble.css
│   │   │   ├── InputBar.jsx
│   │   │   ├── InputBar.css
│   │   │   ├── EmergencyAlert.jsx
│   │   │   ├── EmergencyAlert.css
│   │   │   ├── MoodDashboard.jsx
│   │   │   └── MoodDashboard.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
├── .gitignore
├── requirements.txt             # Root-level mirror of backend dependencies
└── Readme.md
```
\n
## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL running locally
- Twilio account with a verified phone number
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/Haroon-89/mindbridge
cd mental_health_chatbot
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/mindbridge_db
GEMINI_API_KEY=<your_gemini_api_key>
TWILIO_ACCOUNT_SID=<your_twilio_sid>
TWILIO_AUTH_TOKEN=<your_twilio_auth_token>
TWILIO_PHONE_NUMBER=<your_twilio_number>
EMERGENCY_CONTACT_NUMBER=<fallback_number_with_country_code>
```

Create the PostgreSQL database:

```bash
psql -U postgres -c "CREATE DATABASE mindbridge_db;"
```

Ingest the CBT knowledge base into ChromaDB:

```bash
python ../rag/ingest.py
```

Start the backend:

```bash
uvicorn main:app --reload
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.
\n
## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create a new user account (fields: name, email, password, phone, emergency_contact) |
| POST | /auth/login | Login and receive JWT token |
| GET | /auth/me | Get current user profile |
| POST | /auth/update-contact | Update emergency contact number |
| POST | /chat/stream | Streaming chat endpoint using SSE |
| GET | /conversations | Get full conversation history for user |
| POST | /clear-session | Clear in-memory session context |
| GET | /health | Health check |
| GET | / | Basic liveness check |
\n
## Crisis Detection System

The crisis detection runs before every LLM call and cannot be bypassed.

**Keyword matching** runs first and overrides the model. If any Tier 3 keyword is detected such as "kill myself" or "end my life", the LLM is skipped entirely and the emergency flow triggers immediately.

**DistilBERT classification** runs in parallel. If the model detects high-confidence sadness, anger, or fear above 0.85 confidence with no keyword match, the message is escalated to Tier 1.

**Mood badge** is shown on every bot message with the detected emotion label, confidence percentage, and crisis tier if above 0. Tier 2 messages also show an inline hotline banner directly in the chat.

**Tier 3 flow:**
1. LLM is bypassed
2. Emergency SMS is sent to the user's registered emergency contact
3. If no personal contact is set, the fallback number from `.env` is used
4. The crisis event is logged to the database with timestamp and SMS status
5. Emergency resources are displayed prominently in the frontend with hotlines for iCall (9152987821), Vandrevala Foundation (1860-2662-345), and NIMHANS (080-46110007)
\n
## Twilio SMS Note

On a Twilio free trial account, SMS can only be sent to phone numbers that have been manually verified in the Twilio console under Verified Caller IDs. To send to any number, upgrade to a paid Twilio account.
\n
## Evaluation

Run the CLPsych-inspired crisis detection evaluation:

```bash
cd backend
python tests/test_crisis_detection.py
```

This tests 20 messages across four risk categories: No Risk, Low Risk, Moderate Risk, and Severe Risk. The system consistently achieves above 80 percent accuracy on this benchmark.
\n
## Disclaimer

MindBridge is a first-response support tool. It is not a therapist, doctor, or replacement for professional mental health care. If you are in crisis, call iCall at 9152987821, Vandrevala Foundation at 1860-2662-345, or NIMHANS at 080-46110007.
