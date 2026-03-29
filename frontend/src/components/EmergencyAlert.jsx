import './EmergencyAlert.css'

export default function EmergencyAlert({ resources, smsSent }) {
  return (
    <div className="emergency-alert">
      <div className="emergency-header">
        🚨 IMMEDIATE SUPPORT NEEDED
      </div>
      <p className="emergency-body">
        {resources || "You are not alone. Please reach out to a crisis helpline right now."}
      </p>
      <div className="emergency-numbers">
        <div className="hotline">📞 iCall: <strong>9152987821</strong></div>
        <div className="hotline">📞 Vandrevala Foundation: <strong>1860-2662-345</strong></div>
        <div className="hotline">📞 NIMHANS: <strong>080-46110007</strong></div>
      </div>
      {smsSent && (
        <div className="sms-notice">✅ Your emergency contact has been notified.</div>
      )}
    </div>
  )
}
