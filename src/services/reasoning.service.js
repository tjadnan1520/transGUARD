import matcherService from "./matcher.service.js";
import classifierService from "./classifier.service.js";
import severityService from "./severity.service.js";
import departmentService from "./department.service.js";
import reviewService from "./review.service.js";
import geminiService from "./gemini.service.js";
import safetyService from "./safety.service.js";
import responseService from "./response.service.js";
import CaseType from "../enums/caseType.js";
import EvidenceVerdict from "../enums/evidenceVerdict.js";

const normalizeStatus = (transaction = {}) =>
    String(transaction.status || transaction.transaction_status || "").toLowerCase();

const normalizeType = (transaction = {}) =>
    String(transaction.type || transaction.transaction_type || transaction.transactionType || "").toLowerCase();

const getTransactionId = (transaction = {}) =>
    transaction.transaction_id ?? transaction.id ?? transaction.transactionId ?? null;

const getAmount = (transaction = {}) => {
    const amount = Number(transaction.amount ?? transaction.transaction_amount ?? transaction.value);
    return Number.isFinite(amount) ? amount : null;
};

const getCounterparty = (transaction = {}) =>
    String(transaction.counterparty || transaction.recipient_number || transaction.recipientNumber || transaction.to || "").trim();

const getTimestampMs = (transaction = {}) => {
    const value = Date.parse(transaction.timestamp || transaction.created_at || transaction.createdAt || "");
    return Number.isFinite(value) ? value : 0;
};

const findSuspectedDuplicatePayment = (transactions = []) => {
    const completedPayments = transactions
        .filter(tx => normalizeType(tx) === "payment" && normalizeStatus(tx) === "completed")
        .sort((a, b) => getTimestampMs(a) - getTimestampMs(b));

    for (let index = 1; index < completedPayments.length; index += 1) {
        const previous = completedPayments[index - 1];
        const current = completedPayments[index];
        const sameAmount = getAmount(previous) !== null && getAmount(previous) === getAmount(current);
        const sameCounterparty = getCounterparty(previous) && getCounterparty(previous) === getCounterparty(current);
        const closeTime = getTimestampMs(previous) && getTimestampMs(current)
            ? Math.abs(getTimestampMs(current) - getTimestampMs(previous)) <= 10 * 60 * 1000
            : true;

        if (sameAmount && sameCounterparty && closeTime) {
            return current;
        }
    }

    return null;
};

const hasEstablishedRecipientPattern = (transaction, history = []) => {
    const counterparty = getCounterparty(transaction);
    if (!counterparty) return false;

    return history.filter(tx =>
        getTransactionId(tx) !== getTransactionId(transaction)
        && normalizeType(tx) === "transfer"
        && normalizeStatus(tx) === "completed"
        && getCounterparty(tx) === counterparty
    ).length >= 2;
};

const determineEvidenceVerdict = ({ classification = {}, matcherResult = {} } = {}) => {
    const transaction = matcherResult.relevantTransaction;

    if (matcherResult.ambiguous || !transaction) {
        return EvidenceVerdict.INSUFFICIENT_DATA;
    }

    const status = normalizeStatus(transaction);

    switch (classification.case_type) {
        case CaseType.PAYMENT_FAILED:
            if (status === "failed" || status === "pending") return EvidenceVerdict.CONSISTENT;
            if (status === "completed" || status === "reversed") return EvidenceVerdict.INCONSISTENT;
            return EvidenceVerdict.INSUFFICIENT_DATA;

        case CaseType.DUPLICATE_PAYMENT:
            if (matcherResult.duplicateDetected) return EvidenceVerdict.CONSISTENT;
            return status === "completed" ? EvidenceVerdict.CONSISTENT : EvidenceVerdict.INSUFFICIENT_DATA;

        case CaseType.WRONG_TRANSFER:
            if (matcherResult.establishedRecipientPattern) return EvidenceVerdict.INCONSISTENT;
            return status === "completed" ? EvidenceVerdict.CONSISTENT : EvidenceVerdict.INCONSISTENT;

        case CaseType.REFUND_REQUEST:
            if (status === "reversed") return EvidenceVerdict.CONSISTENT;
            if (status === "completed") return EvidenceVerdict.CONSISTENT;
            if (status === "failed") return EvidenceVerdict.INSUFFICIENT_DATA;
            return EvidenceVerdict.INSUFFICIENT_DATA;

        case CaseType.MERCHANT_SETTLEMENT_DELAY:
        case CaseType.AGENT_CASH_IN_ISSUE:
            if (status === "pending" || status === "failed") return EvidenceVerdict.CONSISTENT;
            if (status === "completed") return EvidenceVerdict.INCONSISTENT;
            return EvidenceVerdict.INSUFFICIENT_DATA;

        case CaseType.PHISHING_OR_SOCIAL_ENGINEERING:
            return EvidenceVerdict.CONSISTENT;

        default:
            return matcherResult.confidence >= 0.55
                ? EvidenceVerdict.CONSISTENT
                : EvidenceVerdict.INSUFFICIENT_DATA;
    }
};

const reasoningService = async (ticket = {}) => {
    const matcherResult = matcherService(ticket.complaint, ticket.transaction_history);
    const classification = classifierService(ticket, matcherResult);
    const history = Array.isArray(ticket.transaction_history) ? ticket.transaction_history : [];

    if (classification.case_type === CaseType.OTHER) {
        matcherResult.relevantTransaction = null;
        matcherResult.ambiguous = false;
        matcherResult.confidence = Math.min(matcherResult.confidence || 0, 0.4);
    }

    if (classification.case_type === CaseType.DUPLICATE_PAYMENT) {
        const duplicateTransaction = findSuspectedDuplicatePayment(history);
        if (duplicateTransaction) {
            matcherResult.relevantTransaction = duplicateTransaction;
            matcherResult.ambiguous = false;
            matcherResult.duplicateDetected = true;
            matcherResult.confidence = Math.max(matcherResult.confidence || 0, 0.93);
        }
    }

    if (classification.case_type === CaseType.WRONG_TRANSFER && matcherResult.relevantTransaction) {
        matcherResult.establishedRecipientPattern = hasEstablishedRecipientPattern(
            matcherResult.relevantTransaction,
            history
        );
    }

    const evidence_verdict = determineEvidenceVerdict({ classification, matcherResult });
    const severity = severityService({ classification, matcherResult, evidence_verdict, ticket });
    const department = departmentService(classification, { evidence_verdict, severity });
    const human_review_required = reviewService({
        classification,
        matcherResult,
        evidence_verdict,
        severity
    });
    const narrative = await geminiService({
        ticket,
        matcherResult,
        classification,
        evidence_verdict,
        severity,
        department,
        human_review_required
    });
    const safeNarrative = safetyService(narrative);
    matcherResult.reason_codes = [
        classification.case_type,
        matcherResult.relevantTransaction ? "transaction_match" : "no_transaction_match",
        matcherResult.ambiguous ? "multiple_possible_matches" : null,
        matcherResult.duplicateDetected ? "duplicate_pattern_detected" : null,
        matcherResult.establishedRecipientPattern ? "established_recipient_pattern" : null,
        evidence_verdict === EvidenceVerdict.INCONSISTENT ? "evidence_inconsistent" : null,
        evidence_verdict === EvidenceVerdict.INSUFFICIENT_DATA ? "insufficient_data" : null,
        human_review_required ? "human_review_required" : null
    ].filter(Boolean);

    return responseService({
        ticket,
        matcherResult,
        classification,
        evidence_verdict,
        severity,
        department,
        human_review_required,
        narrative: safeNarrative
    });
};

export default reasoningService;
