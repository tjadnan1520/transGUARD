import systemPrompt from "../prompts/system.prompt.js";
import { GEMINI_CONFIG, SAFE_RESPONSE } from "../utils/constants.js";
import env from "../config/env.js";

const toPlainText = (value) =>
    String(value || "").replace(/```[\s\S]*?```/g, " ").replace(/\s+/g, " ").trim();

const detectBangla = (text = "") => /[\u0980-\u09FF]/.test(text);

const deterministicNarrative = (context = {}) => {
    const isBangla = detectBangla(context.ticket?.complaint);
    const caseType = context.classification?.case_type || "other";
    const verdict = context.evidence_verdict || "insufficient_data";
    const reviewText = context.human_review_required
        ? "A trained support reviewer should verify the case before any resolution is communicated."
        : "Support can proceed using the verified policy and transaction evidence.";

    if (isBangla) {
        return {
            agent_summary: `অভিযোগটি ${caseType} হিসেবে চিহ্নিত হয়েছে এবং প্রমাণের অবস্থা ${verdict}.`,
            recommended_next_action: context.human_review_required
                ? "অফিসিয়াল সাপোর্ট টিমের মাধ্যমে মানব যাচাইয়ে পাঠান।"
                : "প্রমাণ অনুযায়ী অফিসিয়াল সাপোর্ট প্রক্রিয়া অনুসরণ করুন।",
            customer_reply: "আপনার অভিযোগ গ্রহণ করা হয়েছে। আমরা অফিসিয়াল সাপোর্ট চ্যানেলের মাধ্যমে বিষয়টি যাচাই করছি এবং প্রয়োজন হলে ন্যূনতম অতিরিক্ত তথ্য চাইব।"
        };
    }

    return {
        agent_summary: `The complaint was classified as ${caseType} with ${verdict} evidence.`,
        recommended_next_action: reviewText,
        customer_reply: "Thank you for contacting us. We are reviewing the matter through official support channels and will ask only for the minimum information needed if anything else is required."
    };
};

export const buildPrompt = (context = {}) => {
    const transaction = context.matcherResult?.relevantTransaction || null;

    return `
${systemPrompt}

Verified decisions:
ticket_id: ${context.ticket?.ticket_id}
case_type: ${context.classification?.case_type}
department: ${context.department}
severity: ${context.severity}
evidence_verdict: ${context.evidence_verdict}
relevant_transaction_id: ${transaction?.transaction_id ?? transaction?.id ?? transaction?.transactionId ?? "null"}
human_review_required: ${context.human_review_required}

Complaint:
${context.ticket?.complaint}

Write exactly three short plain-text sections using these labels:
agent_summary:
recommended_next_action:
customer_reply:
`;
};

export const callGemini = async (prompt) => {
    if (!env.geminiApiKey) {
        return "";
    }

    const { default: gemini } = await import("../config/gemini.js");

    const result = await gemini.models.generateContent({
        model: GEMINI_CONFIG.MODEL,
        contents: prompt,
        config: {
            temperature: GEMINI_CONFIG.TEMPERATURE,
            topP: GEMINI_CONFIG.TOP_P,
            topK: GEMINI_CONFIG.TOP_K,
            maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS
        }
    });

    return result.text || result.response?.text?.() || "";
};

export const validateAIResponse = (text = "") => {
    const agent = text.match(/agent_summary:\s*([\s\S]*?)(?=recommended_next_action:|customer_reply:|$)/i)?.[1];
    const action = text.match(/recommended_next_action:\s*([\s\S]*?)(?=customer_reply:|agent_summary:|$)/i)?.[1];
    const reply = text.match(/customer_reply:\s*([\s\S]*?)$/i)?.[1];

    if (!agent || !action || !reply) return null;

    return {
        agent_summary: toPlainText(agent),
        recommended_next_action: toPlainText(action),
        customer_reply: toPlainText(reply)
    };
};

export const generateNarrative = async (context = {}) => {
    try {
        if (env.nodeEnv === "test") {
            return deterministicNarrative(context);
        }

        const prompt = buildPrompt(context);
        const text = await Promise.race([
            callGemini(prompt),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), 1500))
        ]);

        return validateAIResponse(text) || deterministicNarrative(context);
    } catch {
        return deterministicNarrative(context);
    }
};

export { deterministicNarrative };

export default generateNarrative;
