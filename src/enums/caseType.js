const CaseType = Object.freeze({
    WRONG_TRANSFER: "wrong_transfer",
    PAYMENT_FAILED: "payment_failed",
    REFUND_REQUEST: "refund_request",
    DUPLICATE_PAYMENT: "duplicate_payment",
    MERCHANT_SETTLEMENT_DELAY: "merchant_settlement_delay",
    AGENT_CASH_IN_ISSUE: "agent_cash_in_issue",
    PHISHING_OR_SOCIAL_ENGINEERING: "phishing_or_social_engineering",
    OTHER: "other"
});

export default CaseType;