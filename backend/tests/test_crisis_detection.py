import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sentiment.classifier import analyze_sentiment

# CLPsych inspired test dataset
# Categories mirror the CLPsych 2015 and 2019 shared task risk levels:
# No Risk | Low Risk | Moderate Risk | Severe Risk

test_cases = [
    # NO RISK — Tier 0 expected
    {"message": "I had a great day today, feeling really happy!", "expected_tier": 0, "category": "No Risk"},
    {"message": "Just finished my assignment, feeling proud of myself", "expected_tier": 0, "category": "No Risk"},
    {"message": "Excited about the weekend plans with friends", "expected_tier": 0, "category": "No Risk"},
    {"message": "Feeling grateful for everything in my life", "expected_tier": 0, "category": "No Risk"},
    {"message": "Had a productive study session today", "expected_tier": 0, "category": "No Risk"},

    # LOW RISK — Tier 1 expected
    {"message": "I have been feeling a bit sad lately", "expected_tier": 1, "category": "Low Risk"},
    {"message": "I am very anxious about my upcoming exams", "expected_tier": 1, "category": "Low Risk"},
    {"message": "Feeling stressed and overwhelmed with everything", "expected_tier": 1, "category": "Low Risk"},
    {"message": "I feel lonely and disconnected from everyone", "expected_tier": 1, "category": "Low Risk"},
    {"message": "Nothing seems to be going right for me", "expected_tier": 1, "category": "Low Risk"},

    # MODERATE RISK — Tier 2 expected
    {"message": "I feel completely hopeless about my future", "expected_tier": 2, "category": "Moderate Risk"},
    {"message": "I feel worthless and like a burden to everyone", "expected_tier": 2, "category": "Moderate Risk"},
    {"message": "I hate myself and everything about my life", "expected_tier": 2, "category": "Moderate Risk"},
    {"message": "I just want to disappear and never come back", "expected_tier": 2, "category": "Moderate Risk"},
    {"message": "Nobody cares whether I exist or not", "expected_tier": 2, "category": "Moderate Risk"},

    # SEVERE RISK — Tier 3 expected
    {"message": "I want to kill myself", "expected_tier": 3, "category": "Severe Risk"},
    {"message": "I am thinking about ending my life", "expected_tier": 3, "category": "Severe Risk"},
    {"message": "I have been hurting myself and I don't care anymore", "expected_tier": 3, "category": "Severe Risk"},
    {"message": "I want to end it all tonight", "expected_tier": 3, "category": "Severe Risk"},
    {"message": "I see no reason to live anymore", "expected_tier": 3, "category": "Severe Risk"},
]


def run_tests():
    print("=" * 60)
    print("MindBridge — CLPsych Inspired Crisis Detection Evaluation")
    print("=" * 60)

    results = []
    correct = 0
    total = len(test_cases)

    category_scores = {
        "No Risk": {"correct": 0, "total": 0},
        "Low Risk": {"correct": 0, "total": 0},
        "Moderate Risk": {"correct": 0, "total": 0},
        "Severe Risk": {"correct": 0, "total": 0},
    }

    for i, test in enumerate(test_cases):
        result = analyze_sentiment(test["message"])
        predicted_tier = result["crisis_tier"]
        expected_tier = test["expected_tier"]
        is_correct = predicted_tier == expected_tier
        category = test["category"]

        if is_correct:
            correct += 1
            category_scores[category]["correct"] += 1
        category_scores[category]["total"] += 1

        status = "PASS" if is_correct else "FAIL"
        results.append({
            "message": test["message"],
            "category": category,
            "expected": expected_tier,
            "predicted": predicted_tier,
            "status": status
        })

        print(f"\n[{i+1:02d}] {status} | {category}")
        print(f"     Message  : {test['message']}")
        print(f"     Expected : Tier {expected_tier} | Predicted: Tier {predicted_tier}")
        print(f"     Mood     : {result['mood_label']} | Confidence: {result['confidence']}")

    # Summary
    accuracy = (correct / total) * 100
    print("\n" + "=" * 60)
    print("EVALUATION SUMMARY")
    print("=" * 60)
    print(f"Overall Accuracy : {correct}/{total} = {accuracy:.1f}%")
    print()
    print("Per Category Results:")
    for category, scores in category_scores.items():
        cat_accuracy = (scores["correct"] / scores["total"]) * 100
        print(f"  {category:15s}: {scores['correct']}/{scores['total']} = {cat_accuracy:.0f}%")

    print()
    if accuracy >= 80:
        print("RESULT: EXCELLENT — Crisis detection is production ready")
    elif accuracy >= 60:
        print("RESULT: GOOD — Crisis detection is working well")
    else:
        print("RESULT: NEEDS IMPROVEMENT")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()