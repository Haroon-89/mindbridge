from langchain_core.messages import HumanMessage, AIMessage

# Store sessions in memory — each session_id gets its own history
session_store = {}

def get_session_memory(session_id: str):
    if session_id not in session_store:
        session_store[session_id] = []
    return session_store[session_id]

def add_to_memory(session_id: str, user_message: str, bot_response: str):
    if session_id not in session_store:
        session_store[session_id] = []
    session_store[session_id].append(HumanMessage(content=user_message))
    session_store[session_id].append(AIMessage(content=bot_response))

def get_chat_history(session_id: str) -> str:
    if session_id not in session_store:
        return ""
    messages = session_store[session_id]
    history = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            history.append(f"User: {msg.content}")
        elif isinstance(msg, AIMessage):
            history.append(f"Assistant: {msg.content}")
    # Keep last 6 messages only — prevents context overflow
    last_6 = history[-6:] if len(history) > 6 else history
    return "\n".join(last_6)

def clear_session(session_id: str):
    if session_id in session_store:
        del session_store[session_id]
        return True
    return False