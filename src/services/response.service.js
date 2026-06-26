import CaseType from "../enums/caseType.js";
import Department from "../enums/department.js";
import EvidenceVerdict from "../enums/evidenceVerdict.js";
import Severity from "../enums/severity.js";
import { SAFE_RESPONSE } from "../utils/constants.js";

const enumOrDefault = (value, allowed, fallback) =>
    Object.values(allowed).includes(value) ? value : fallback;

export const normalizeOutput = (payload = {}) => ({
    ticket_id: String(payload.ticket_id || ""),
    relevant_transaction_id: payload.relevant_transaction_id ?? null,
    evidence_verdict: enumOrDefault(payload.evidence_verdict, EvidenceVerdict, EvidenceVerdict.INSUFFICIENT_DATA),
    case_type: enumOrDefault(payload.case_type, CaseType, CaseType.OTHER),
    severity: enumOrDefault(payload.severity, Severity, Severity.LOW),
    department: enumOrDefault(payload.department, Department, Department.CUSTOMER_SUPPORT),
    human_review_required: Boolean(payload.human_review_required),
    agent_summary: String(payload.agent_summary || SAFE_RESPONSE.AGENT_SUMMARY),
    recommended_next_action: String(payload.recommended_next_action || SAFE_RESPONSE.NEXT_ACTION),
    customer_reply: String(payload.customer_reply || SAFE_RESPONSE.CUSTOMER_REPLY),
    confidence: Number.isFinite(Number(payload.confidence))
        ? Math.max(0, Math.min(1, Number(Number(payload.confidence).toFixed(2))))
        : 0,
    reason_codes: Array.isArray(payload.reason_codes) ? payload.reason_codes : []
});

export const attachMetadata = (response) => response;

export const buildResponse = ({
    ticket,
    matcherResult,
    classification,
    evidence_verdict,
    severity,
    department,
    human_review_required,
    narrative
} = {}) => {
    const transaction = matcherResult?.ambiguous ? null : matcherResult?.relevantTransaction;
    const relevantId = transaction?.transaction_id
        ?? transaction?.id
        ?? transaction?.transactionId
        ?? null;
    const confidence = Math.max(
        matcherResult?.confidence || 0,
        classification?.classification_confidence || 0
    );

    return attachMetadata(normalizeOutput({
        ticket_id: ticket?.ticket_id,
        relevant_transaction_id: relevantId,
        evidence_verdict,
        case_type: classification?.case_type,
        severity,
        department,
        human_review_required,
        agent_summary: narrative?.agent_summary,
        recommended_next_action: narrative?.recommended_next_action,
        customer_reply: narrative?.customer_reply,
        confidence,
        reason_codes: matcherResult?.reason_codes
    }));
};

export default buildResponse;
