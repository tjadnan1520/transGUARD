import CaseType from "../enums/caseType.js";
import Department from "../enums/department.js";

const DEPARTMENT_BY_CASE = Object.freeze({
    [CaseType.WRONG_TRANSFER]: Department.DISPUTE_RESOLUTION,
    [CaseType.PAYMENT_FAILED]: Department.PAYMENTS_OPS,
    [CaseType.REFUND_REQUEST]: Department.CUSTOMER_SUPPORT,
    [CaseType.DUPLICATE_PAYMENT]: Department.PAYMENTS_OPS,
    [CaseType.MERCHANT_SETTLEMENT_DELAY]: Department.MERCHANT_OPERATIONS,
    [CaseType.AGENT_CASH_IN_ISSUE]: Department.AGENT_OPERATIONS,
    [CaseType.PHISHING_OR_SOCIAL_ENGINEERING]: Department.FRAUD_RISK,
    [CaseType.OTHER]: Department.CUSTOMER_SUPPORT
});

export const mapDepartment = (caseType) =>
    DEPARTMENT_BY_CASE[caseType] || Department.CUSTOMER_SUPPORT;

export const applyRoutingOverrides = (department, context = {}) => {
    if (context.case_type === CaseType.PHISHING_OR_SOCIAL_ENGINEERING || context.severity === "critical") {
        return Department.FRAUD_RISK;
    }

    if (context.case_type === CaseType.MERCHANT_SETTLEMENT_DELAY) {
        return Department.MERCHANT_OPERATIONS;
    }

    if (context.case_type === CaseType.AGENT_CASH_IN_ISSUE) {
        return Department.AGENT_OPERATIONS;
    }

    if (context.evidence_verdict === "inconsistent" && context.case_type !== CaseType.REFUND_REQUEST) {
        return Department.DISPUTE_RESOLUTION;
    }

    return department;
};

export const resolveDepartment = (classification = {}, context = {}) => {
    const baseDepartment = mapDepartment(classification.case_type);

    return applyRoutingOverrides(baseDepartment, {
        ...context,
        case_type: classification.case_type
    });
};

export default resolveDepartment;
