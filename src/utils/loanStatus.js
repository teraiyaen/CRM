// Distinct nonblank loan statuses in the client MIS and operations CSVs.
export const SOURCE_LOAN_STATUSES = ['Initiated', 'Sanctioned', 'Partial Disburse', 'Disbursed', 'Completed', 'Reject'];
export function loanStatusOptions(current) {
    return [...new Set([...SOURCE_LOAN_STATUSES, ...(current ? [String(current)] : [])])];
}
