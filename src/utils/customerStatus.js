// Only saved database status fields can identify a customer's status.
// Missing data must never be presented as a completed registration step.
export function recordedCustomerStatus(customer = {}) {
    return [customer.portal_status, customer.status]
        .map(value => typeof value === 'string' ? value.trim() : '')
        .find(Boolean) || null;
}
export function customerStatusLabel(customer) {
    return recordedCustomerStatus(customer) || 'Status not recorded';
}
