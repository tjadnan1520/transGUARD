import CaseType from "../enums/caseType.js";
import { containsKeyword, normalizeText } from "../utils/helpers.js";

const KEYWORDS = {
    fraud: [
        "otp", "pin", "password", "verification code", "code dise", "scam",
        "fraud", "phishing", "fake call", "unknown link", "account hack",
        "social engineering", "প্রতার", "ওটিপি", "পিন", "পাসওয়ার্ড"
    ],
    wrongTransfer: [
        "wrong transfer", "wrong number", "wrong account", "mistakenly sent",
        "sent to wrong", "vul number", "vul num", "vul kore", "bhul number",
        "bhul kore", "wrongly sent", "wrong person", "by mistake", "reverse it",
        "sent money", "transferred money", "send money",
        "didn't get it", "didn t get it", "did not get it", "not received", "ভুল নাম্বার",
        "ভুল নম্বর", "ভুল করে"
    ],
    duplicatePayment: [
        "duplicate", "twice", "double payment", "charged twice", "paid twice",
        "দুইবার", "ডাবল", "একই পেমেন্ট"
    ],
    paymentFailed: [
        "payment failed", "failed payment", "money deducted", "deducted but",
        "merchant did not receive", "payment hoyni", "পেমেন্ট হয়নি",
        "টাকা কেটে", "failed"
    ],
    refund: [
        "refund", "money back", "return my money", "reversal", "ফেরত",
        "রিফান্ড", "টাকা ফেরত"
    ],
    merchantSettlement: [
        "settlement", "merchant payout", "merchant settlement", "payout delay",
        "settlement pending", "মার্চেন্ট সেটেলমেন্ট"
    ],
    agentCashIn: [
        "cash in", "cashin", "add money", "agent", "deposit", "ক্যাশ ইন",
        "এজেন্ট", "agent cash"
    ],
    dispute: [
        "dispute", "complain", "not received", "did not receive", "পাইনি",
        "রিসিভ করেনি"
    ]
};

export const detectFraudIndicators = (complaint = "", context = {}) => {
    const text = normalizeText(`${complaint} ${context.campaign_context || ""}`);

    return {
        hasFraudKeyword: containsKeyword(text, KEYWORDS.fraud),
        hasSensitiveCredential: containsKeyword(text, ["otp", "pin", "password", "cvv", "card number", "ওটিপি", "পিন"]),
        hasUnofficialContact: containsKeyword(text, ["whatsapp", "telegram", "imo", "personal number", "facebook inbox"]),
        hasUnknownActor: containsKeyword(text, ["unknown", "fake", " অপরিচিত", "অজানা"])
    };
};

export const detectIntent = (complaint = "") => {
    const text = normalizeText(complaint);

    if (containsKeyword(text, KEYWORDS.refund)) return "refund";
    if (containsKeyword(text, KEYWORDS.dispute)) return "dispute";
    if (containsKeyword(text, ["status", "where", "update", "কি অবস্থা"])) return "inquiry";
    return "investigation";
};

export const detectCaseType = (complaint = "", matcherResult = {}) => {
    const text = normalizeText(complaint);
    const transactionType = matcherResult.relevantTransaction?.type
        || matcherResult.relevantTransaction?.transaction_type
        || matcherResult.relevantTransaction?.transactionType;

    if (detectFraudIndicators(complaint).hasFraudKeyword) {
        return CaseType.PHISHING_OR_SOCIAL_ENGINEERING;
    }
    if (containsKeyword(text, KEYWORDS.wrongTransfer)) return CaseType.WRONG_TRANSFER;
    if (
        containsKeyword(text, ["sent", "send", "transfer", "transferred"])
        && containsKeyword(text, ["not received", "didn't get", "didn t get", "did not get", "paini", "pai nai"])
    ) {
        return CaseType.WRONG_TRANSFER;
    }
    if (containsKeyword(text, KEYWORDS.duplicatePayment)) return CaseType.DUPLICATE_PAYMENT;
    if (containsKeyword(text, KEYWORDS.merchantSettlement) || transactionType === "settlement" || transactionType === "merchant_settlement") {
        return CaseType.MERCHANT_SETTLEMENT_DELAY;
    }
    if (containsKeyword(text, KEYWORDS.agentCashIn) || transactionType === "cash_in") {
        return CaseType.AGENT_CASH_IN_ISSUE;
    }
    if (containsKeyword(text, KEYWORDS.paymentFailed)) return CaseType.PAYMENT_FAILED;
    if (containsKeyword(text, KEYWORDS.refund)) return CaseType.REFUND_REQUEST;

    return CaseType.OTHER;
};

export const calculateClassificationConfidence = (caseType, complaint = "", matcherResult = {}) => {
    if (caseType === CaseType.OTHER) return matcherResult.confidence ? Math.min(matcherResult.confidence, 0.45) : 0.25;

    const text = normalizeText(complaint);
    const keywordGroups = Object.values(KEYWORDS);
    const keywordHits = keywordGroups.reduce((count, group) => count + (containsKeyword(text, group) ? 1 : 0), 0);
    const base = 0.55 + Math.min(keywordHits * 0.12, 0.3);
    const matchBoost = matcherResult.relevantTransaction ? 0.1 : 0;

    return Math.min(1, Number((base + matchBoost).toFixed(2)));
};

export const classifyCase = (ticket = {}, matcherResult = {}) => {
    const case_type = detectCaseType(ticket.complaint, matcherResult);

    return {
        case_type,
        intent: detectIntent(ticket.complaint),
        fraud_indicators: detectFraudIndicators(ticket.complaint, ticket),
        classification_confidence: calculateClassificationConfidence(case_type, ticket.complaint, matcherResult)
    };
};

export default classifyCase;
