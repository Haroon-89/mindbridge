from transformers import pipeline

MODEL_NAME = "bhadresh-savani/distilbert-base-uncased-emotion"

_classifier_pipeline = None

def _get_pipeline():
    global _classifier_pipeline
    if _classifier_pipeline is None:
        print("Loading DistilBERT emotion model...")
        _classifier_pipeline = pipeline(
            "text-classification",
            model=MODEL_NAME,
            return_all_scores=True,
            device=-1
        )
        print("Model loaded.")
    return _classifier_pipeline

# Map model emotion labels to our mood states
EMOTION_TO_MOOD = {
    "sadness": "sad",
    "anger": "anxious",
    "fear": "anxious",
    "joy": "hopeful",
    "love": "hopeful",
    "surprise": "neutral"
}

# Crisis keywords — deterministic matching (never relies on AI alone)
TIER3_KEYWORDS = [
    "kill myself", "want to die", "end my life", "suicide",
    "suicidal", "hurt myself", "self harm", "cut myself",
    "no reason to live", "better off dead", "end it all",
    "don't want to be here anymore", "take my own life"
]

TIER2_KEYWORDS = [
    "can't go on", "give up", "hopeless", "worthless",
    "nobody cares", "disappear", "hate myself", "can't take it",
    "falling apart", "breaking down", "no point", "exhausted",
    "empty inside", "numb", "trapped"
]


def check_keywords(message: str):
    message_lower = message.lower()

    # Check Tier 3 first — highest priority
    for keyword in TIER3_KEYWORDS:
        if keyword in message_lower:
            return 3, keyword

    # Check Tier 2
    for keyword in TIER2_KEYWORDS:
        if keyword in message_lower:
            return 2, keyword

    return 0, None


def analyze_sentiment(message: str):
    # Step 1 — keyword check first (deterministic, always runs)
    keyword_tier, matched_keyword = check_keywords(message)

    results = _get_pipeline()(message)

    # Handle both possible output formats
    if isinstance(results[0], list):
        results = results[0]
    else:
        results = results

    # Get highest scoring emotion
    top_emotion = max(results, key=lambda x: x["score"])
    emotion_label = top_emotion["label"]
    emotion_score = top_emotion["score"]

    # Map to our mood label
    mood_label = EMOTION_TO_MOOD.get(emotion_label, "neutral")

    # Step 3 — determine final crisis tier
    # Keywords override everything — safety first
    if keyword_tier == 3:
        final_tier = 3
    elif keyword_tier == 2:
        final_tier = 2
    elif emotion_label in ["sadness", "anger", "fear"] and emotion_score > 0.85:
        # High confidence distress from model — elevate to Tier 1
        final_tier = 1
    else:
        final_tier = 0

    return {
        "mood_label": mood_label,
        "emotion": emotion_label,
        "confidence": round(emotion_score, 4),
        "crisis_tier": final_tier,
        "keyword_matched": matched_keyword,
        "raw_scores": {r["label"]: round(r["score"], 4) for r in results}
    }


if __name__ == "__main__":
    test_messages = [
        "I am feeling great today!",
        "I feel a bit sad and lonely",
        "I am very anxious about my exams",
        "I feel completely hopeless and worthless",
        "I want to kill myself"
    ]

    print("\n--- Sentiment Analysis Test ---\n")
    for msg in test_messages:
        result = analyze_sentiment(msg)
        print(f"Message: {msg}")
        print(f"Mood: {result['mood_label']} | Tier: {result['crisis_tier']} | Confidence: {result['confidence']}")
        if result['keyword_matched']:
            print(f"Keyword matched: {result['keyword_matched']}")
        print()