from fastapi import FastAPI

app = FastAPI(title="MindBridge API")

@app.get("/")
def health_check():
    return {"status": "MindBridge backend is live"}