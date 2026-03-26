EMERGENCY_RESOURCES = """
IMMEDIATE HELP AVAILABLE — You are not alone.

India Crisis Helplines:
- iCall: 9152987821 (Mon-Sat, 8AM-10PM)
- Vandrevala Foundation: 1860-2662-345 (24/7)
- AASRA: 9820466627 (24/7)
- iCall Email: icall@tiss.edu

International:
- Crisis Text Line: Text HOME to 741741
- Befrienders Worldwide: www.befrienders.org

Please reach out to one of these right now.
You matter and help is available immediately.
"""

TIER1_RESPONSE = """
I hear you and I want you to know your feelings are completely valid.
What you are going through sounds really difficult.
Let me share something that might help right now.
Remember I am here to support you, and speaking with a counselor 
can provide even more personalized help.
"""

TIER2_RESPONSE = """
I can hear that you are going through something really painful right now.
Your feelings are valid and you deserve support.
I want you to know that you are not alone in this.
Please consider reaching out to a counselor or trusted person today.
If things feel too heavy, please contact a helpline — 
trained people are ready to listen right now.
"""

TIER3_RESPONSE = """
I am very concerned about your safety right now and I care about you.
Please reach out to emergency services or a crisis helpline immediately.
You do not have to face this alone — help is available right now.
"""


def get_crisis_response(tier: int):
    if tier == 3:
        return {
            "type": "crisis",
            "tier": 3,
            "message": TIER3_RESPONSE.strip(),
            "emergency_resources": EMERGENCY_RESOURCES.strip(),
            "bypass_llm": True,
            "action": "TRIGGER_SMS"
        }
    elif tier == 2:
        return {
            "type": "elevated",
            "tier": 2,
            "message": TIER2_RESPONSE.strip(),
            "emergency_resources": EMERGENCY_RESOURCES.strip(),
            "bypass_llm": False,
            "action": "SHOW_HOTLINES"
        }
    elif tier == 1:
        return {
            "type": "mild",
            "tier": 1,
            "message": TIER1_RESPONSE.strip(),
            "emergency_resources": None,
            "bypass_llm": False,
            "action": "ADD_EMPATHY"
        }
    else:
        return {
            "type": "normal",
            "tier": 0,
            "message": None,
            "emergency_resources": None,
            "bypass_llm": False,
            "action": "NORMAL"
        }


if __name__ == "__main__":
    print("--- Crisis Handler Test ---\n")
    for tier in [0, 1, 2, 3]:
        response = get_crisis_response(tier)
        print(f"Tier {tier}: action={response['action']} | bypass_llm={response['bypass_llm']}")