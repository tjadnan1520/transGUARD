import {
    MAX_AGENT_SUMMARY_LENGTH,
    MAX_CUSTOMER_REPLY_LENGTH,
    MAX_RECOMMENDED_ACTION_LENGTH,
    SAFE_RESPONSE
} from "../utils/constants.js";

const UNSAFE_PATTERNS = [
    /\b(share|send|provide|tell|give)\s+(your\s+)?(otp|pin|password|cvv|card number|verification code)\b/gi,
    /\b(ask|request|need|collect)\s+(for\s+)?(your\s+)?(otp|pin|password|cvv|card number|verification code)\b/gi,
    /\b(we|i|support)\s+(will|must|can)\s+(refund|recover|unblock|reverse|compensate)\b/gi,
    /\b(refund|reversal|recovery|unblock|compensation)\s+(is\s+)?(guaranteed|confirmed|promised)\b/gi,
    /\b(contact|message|call)\s+(us\s+)?(on|via|through)\s+(whatsapp|telegram|imo|facebook|personal number)\b/gi,
    /\bthird[-\s]?party\s+(agent|contact|number|service)\b/gi
];

const FIELD_LIMITS = {
    agent_summary: MAX_AGENT_SUMMARY_LENGTH,
    recommended_next_action: MAX_RECOMMENDED_ACTION_LENGTH,
    customer_reply: MAX_CUSTOMER_REPLY_LENGTH
};

const FALLBACK_BY_FIELD = {
    agent_summary: SAFE_RESPONSE.AGENT_SUMMARY,
    recommended_next_action: SAFE_RESPONSE.NEXT_ACTION,
    customer_reply: SAFE_RESPONSE.CUSTOMER_REPLY
};

const trimToLimit = (text, limit) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= limit) return clean;
    return clean.slice(0, limit - 1).trim();
};

export const validateOutput = (text = "") =>
    !UNSAFE_PATTERNS.some(pattern => {
        pattern.lastIndex = 0;
        return pattern.test(text);
    });

export const removeUnsafeContent = (text = "", fallback = SAFE_RESPONSE.CUSTOMER_REPLY) => {
    if (!text || !validateOutput(text)) return fallback;
    return text;
};

export const preventSensitiveDisclosure = (text = "", fallback) =>
    removeUnsafeContent(text, fallback);

export const sanitizeResponse = (narrative = {}) => {
    const sanitized = {};

    for (const field of Object.keys(FIELD_LIMITS)) {
        const fallback = FALLBACK_BY_FIELD[field];
        const safeText = preventSensitiveDisclosure(narrative[field], fallback);
        sanitized[field] = trimToLimit(safeText || fallback, FIELD_LIMITS[field]);
    }

    return sanitized;
};

export default sanitizeResponse;
