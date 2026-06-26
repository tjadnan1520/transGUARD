import CaseType from "../enums/caseType.js";
import Severity from "../enums/severity.js";

const HIGH_VALUE_AMOUNT = 10000;
const CRITICAL_VALUE_AMOUNT = 50000;

const getAmount = (transaction) => {
    const amount = transaction?.amount ?? transaction?.transaction_amount ?? transaction?.value;
    const parsed = Number(amount);

    return Number.isFinite(parsed) ? parsed : 0;
};

export const evaluateFinancialImpact = (transaction, ticket = {}) => {
    const amount = getAmount(transaction);
    const metadataAmount = Number(ticket.metadata?.amount);
    const effectiveAmount = amount || (Number.isFinite(metadataAmount) ? metadataAmount : 0);

    if (effectiveAmount >= CRITICAL_VALUE_AMOUNT) return "critical";
    if (effectiveAmount >= HIGH_VALUE_AMOUNT) return "high";
    if (effectiveAmount > 0) return "medium";
    return "low";
};

export const evaluateFraudRisk = (classification = {}) => {
    if (classification.case_type === CaseType.PHISHING_OR_SOCIAL_ENGINEERING) return "critical";

    const indicators = classification.fraud_indicators || {};
    if (indicators.hasSensitiveCredential || indicators.hasUnofficialContact) return "high";
    if (indicators.hasFraudKeyword || indicators.hasUnknownActor) return "medium";
    return "low";
};

export const evaluateUrgency = ({ case_type, evidence_verdict, ambiguous } = {}) => {
    if (case_type === CaseType.PHISHING_OR_SOCIAL_ENGINEERING) return "critical";
    if (case_type === CaseType.WRONG_TRANSFER || case_type === CaseType.DUPLICATE_PAYMENT) return "high";
    if (ambiguous || evidence_verdict === "inconsistent") return "high";
    if (case_type === CaseType.PAYMENT_FAILED) return "high";
    if (case_type === CaseType.MERCHANT_SETTLEMENT_DELAY || case_type === CaseType.AGENT_CASH_IN_ISSUE) return "medium";
    return "low";
};

const maxSeverity = (...values) => {
    const order = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL];
    return values.reduce((max, value) =>
        order.indexOf(value) > order.indexOf(max) ? value : max, Severity.LOW);
};

export const calculateSeverity = ({ classification = {}, matcherResult = {}, evidence_verdict, ticket = {} } = {}) => {
    const caseType = classification.case_type;

    if (caseType === CaseType.PHISHING_OR_SOCIAL_ENGINEERING) return Severity.CRITICAL;
    if (caseType === CaseType.WRONG_TRANSFER) {
        if (!matcherResult.relevantTransaction || evidence_verdict === "insufficient_data") return Severity.MEDIUM;
        if (evidence_verdict === "inconsistent") return Severity.MEDIUM;
        return Severity.HIGH;
    }
    if (caseType === CaseType.DUPLICATE_PAYMENT) return Severity.HIGH;
    if (caseType === CaseType.PAYMENT_FAILED) return Severity.HIGH;
    if (caseType === CaseType.MERCHANT_SETTLEMENT_DELAY) return Severity.MEDIUM;
    if (caseType === CaseType.AGENT_CASH_IN_ISSUE) return Severity.HIGH;
    if (caseType === CaseType.REFUND_REQUEST) return Severity.LOW;

    return maxSeverity(
        evaluateFinancialImpact(matcherResult.relevantTransaction, ticket),
        evaluateFraudRisk(classification),
        evaluateUrgency({ case_type: caseType, evidence_verdict, ambiguous: matcherResult.ambiguous })
    );
};

export default calculateSeverity;
