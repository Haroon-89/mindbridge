from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
EMERGENCY_CONTACT   = os.getenv("EMERGENCY_CONTACT_NUMBER")


def send_crisis_sms(user_first_name: str = "A user", custom_number: str = None):
    print(f"\n--- Twilio SMS Attempt ---")
    print(f"SID loaded:   {'YES' if TWILIO_ACCOUNT_SID else 'NO'}")
    print(f"Token loaded: {'YES' if TWILIO_AUTH_TOKEN else 'NO'}")
    print(f"From number:  {TWILIO_PHONE_NUMBER}")
    print(f"Custom target: {custom_number}")
    print(f"Env fallback:  {EMERGENCY_CONTACT}")

    try:
        if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
            print("ERROR: Twilio credentials missing in .env")
            return {"success": False, "error": "Missing Twilio credentials"}

        # Use user's personal emergency contact if provided, else fall back to env default
        target = (custom_number or "").strip() or (EMERGENCY_CONTACT or "").strip()

        if not target:
            print("ERROR: No emergency contact number available")
            return {"success": False, "error": "No emergency contact number set"}

        if not target.startswith("+"):
            print(f"ERROR: Number '{target}' must start with + and country code e.g. +91xxxxxxxxxx")
            return {"success": False, "error": f"Invalid phone format: {target}"}

        print(f"Sending SMS to: {target}")
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        message = client.messages.create(
            body=(
                f"MindBridge ALERT: {user_first_name} may need immediate mental health support right now. "
                f"Please check on them urgently. This is an automated safety alert from MindBridge."
            ),
            from_=TWILIO_PHONE_NUMBER,
            to=target
        )

        print(f"SMS sent! SID: {message.sid} | Status: {message.status}")
        return {"success": True, "sid": message.sid}

    except Exception as e:
        print(f"SMS FAILED: {type(e).__name__}: {str(e)}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    print("Testing Twilio SMS...")
    result = send_crisis_sms("Test User")
    print(f"Result: {result}")
