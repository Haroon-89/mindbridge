# Specific CBT modules triggered based on detected mood state
# Each mood gets a targeted exercise instead of generic retrieval

CBT_MODULES = {
    "anxious": {
        "module_name": "Anxiety Grounding Module",
        "primary_technique": "4-7-8 Breathing Exercise",
        "instruction": """
Guide the user through the 4-7-8 breathing technique:
1. Ask them to sit comfortably and close their eyes
2. Inhale quietly through nose for 4 seconds
3. Hold breath for 7 seconds
4. Exhale completely through mouth for 8 seconds
5. Repeat 3 to 4 times
Tell them this activates the parasympathetic nervous system and reduces anxiety within minutes.
""",
        "followup": "After the breathing exercise, offer the 5-4-3-2-1 grounding technique if they need more support."
    },

    "sad": {
        "module_name": "Low Mood Activation Module",
        "primary_technique": "Behavioral Activation",
        "instruction": """
Guide the user through behavioral activation for low mood:
1. Validate their sadness first — never dismiss it
2. Ask them to identify one tiny enjoyable activity (even 5 minutes)
3. Encourage them to do it even if they don't feel like it
4. Remind them that action comes before motivation, not after
5. Celebrate any small step they take
""",
        "followup": "Also suggest the self compassion exercise — hand on heart, kind words to self."
    },

    "hopeful": {
        "module_name": "Positive Reinforcement Module",
        "primary_technique": "Strength Acknowledgment",
        "instruction": """
The user is in a positive state. Reinforce and build on this:
1. Acknowledge and celebrate their positive feelings
2. Ask what is contributing to their good mood
3. Help them identify personal strengths they demonstrated
4. Encourage them to note this moment for difficult days ahead
""",
        "followup": "Suggest keeping a gratitude journal to maintain this positive momentum."
    },

    "neutral": {
        "module_name": "Psychoeducation Module",
        "primary_technique": "Mood Awareness",
        "instruction": """
The user is in a neutral state. Use this as an opportunity for psychoeducation:
1. Gently check in about how they have been feeling overall
2. Share one interesting fact about emotional wellbeing
3. Introduce the concept of mood tracking
4. Ask if there is anything on their mind they would like to explore
""",
        "followup": "Offer to share a simple mindfulness exercise if they are interested."
    },

    "distressed": {
        "module_name": "Crisis Support Module",
        "primary_technique": "Immediate Stabilization",
        "instruction": """
The user is in significant distress. Focus on immediate stabilization:
1. Validate their pain without minimizing it
2. Guide them through box breathing immediately
3. Remind them this feeling is temporary and will pass
4. Encourage them to reach out to someone they trust
5. Provide crisis helpline numbers naturally in the conversation
""",
        "followup": "Monitor closely — if distress escalates, crisis tier will automatically escalate."
    }
}


def get_cbt_module(mood_label: str) -> dict:
    return CBT_MODULES.get(mood_label, CBT_MODULES["neutral"])


def get_module_instruction(mood_label: str) -> str:
    module = get_cbt_module(mood_label)
    return f"""
CBT Module Activated: {module['module_name']}
Primary Technique: {module['primary_technique']}
Instructions: {module['instruction']}
Follow-up suggestion: {module['followup']}
"""


if __name__ == "__main__":
    print("--- CBT Module Test ---\n")
    for mood in ["anxious", "sad", "hopeful", "neutral", "distressed"]:
        module = get_cbt_module(mood)
        print(f"Mood: {mood} → Module: {module['module_name']} | Technique: {module['primary_technique']}")