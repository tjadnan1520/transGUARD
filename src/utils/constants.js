export const API_VERSION = "v1";

export const DEFAULT_LANGUAGE = "en";

export const DEFAULT_CONFIDENCE = 0;

export const MIN_CONFIDENCE = 0;

export const MAX_CONFIDENCE = 1;

export const MAX_AGENT_SUMMARY_LENGTH = 300;

export const MAX_CUSTOMER_REPLY_LENGTH = 500;

export const MAX_RECOMMENDED_ACTION_LENGTH = 200;

export const MAX_COMPLAINT_LENGTH = 5000;

export const MAX_TRANSACTION_HISTORY = 500;

export const DEFAULT_TIMEZONE = "Asia/Dhaka";

export const DEFAULT_CURRENCY = "BDT";

export const SUPPORTED_LANGUAGES = [
    "en",
    "bn",
    "mixed"
];

export const SAFE_RESPONSE = {
    AGENT_SUMMARY:
        "Unable to determine sufficient evidence from the available information.",

    CUSTOMER_REPLY:
        "Thank you for contacting us. We are reviewing your request. If additional information is required, we will contact you through official channels.",

    NEXT_ACTION:
        "Review the available evidence and request additional information if necessary."
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
};

export const RESPONSE_STATUS = {
    SUCCESS: "success",
    FAILED: "failed"
};

export const GEMINI_CONFIG = {
    MODEL: "gemini-2.5-flash",
    TEMPERATURE: 0.2,
    TOP_P: 0.9,
    TOP_K: 40,
    MAX_OUTPUT_TOKENS: 512
};

export const LOG_LEVEL = {
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};