import CaseType from "../enums/caseType.js";
import Severity from "../enums/severity.js";

const LARGE_AMOUNT = 10000;

const getAmount = (transaction) => {
    const amount = transaction?.amount ?? transaction?.transaction_amount ?? transaction?.value;
    const parsed = Number(amount);

    return Number.isFinite(parsed) ? parsed : 0;
};

export const evaluateReviewRules = ({ classification = {}, matcherResult = {}, evidence_verdict, severity } = {}) => {
    const amount = getAmount(matcherResult.relevantTransaction);

    return [
        {
            matched: classification.case_type === CaseType.PHISHING_OR_SOCIAL_ENGINEERING,
            reason: "fraud_risk"
        },
        {
            matched: classification.case_type === CaseType.WRONG_TRANSFER
                && (Boolean(matcherResult.relevantTransaction) || evidence_verdict === "inconsistent"),
            reason: "wrong_transfer"
        },
        {
            matched: severity === Severity.CRITICAL,
            reason: "critical_severity"
        },
        {
            matched: classification.case_type === CaseType.DUPLICATE_PAYMENT,
            reason: "duplicate_payment_requires_verification"
        },
        {
            matched: classification.case_type === CaseType.AGENT_CASH_IN_ISSUE && Boolean(matcherResult.relevantTransaction),
            reason: "agent_cash_in_issue"
        },
        {
            matched: (matcherResult.ambiguous
                    && !(classification.case_type === CaseType.WRONG_TRANSFER && !matcherResult.relevantTransaction))
                || (evidence_verdict === "insufficient_data"
                    && classification.case_type !== CaseType.REFUND_REQUEST
                    && classification.case_type !== CaseType.OTHER
                    && !(classification.case_type === CaseType.WRONG_TRANSFER && !matcherResult.relevantTransaction)),
            reason: "ambiguous_or_insufficient_evidence"
        },
        {
            matched: evidence_verdict === "inconsistent",
            reason: "disputed_or_inconsistent_evidence"
        },
        {
            matched: amount >= LARGE_AMOUNT
                && classification.case_type !== CaseType.MERCHANT_SETTLEMENT_DELAY
                && classification.case_type !== CaseType.REFUND_REQUEST,
            reason: "large_amount"
        },
        {
            matched: classification.fraud_indicators?.hasUnofficialContact || classification.fraud_indicators?.hasUnknownActor,
            reason: "suspicious_pattern"
        }
    ];
};

export const getReviewReason = (context = {}) => {
    const rule = evaluateReviewRules(context).find(item => item.matched);
    return rule?.reason || null;
};

export const requiresHumanReview = (context = {}) =>
    evaluateReviewRules(context).some(item => item.matched);

export default requiresHumanReview;
