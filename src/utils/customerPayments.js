// PAYMENT is cumulative money received; ACTUAL PAYMENT is the quotation total.
// Do not subtract loan disbursements again: the client confirmed this formula.
function amount(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const text = String(value).trim().replaceAll(',', '');
    if (!/^-?\d+(\.\d{1,2})?$/.test(text)) return null;
    const cents = Math.round(Number(text) * 100);
    return Number.isSafeInteger(cents) ? cents : null;
}
export function paymentLeft(quotation, received) {
    const quote = amount(quotation);
    const paid = amount(received);
    return quote === null || paid === null ? null : (quote - paid) / 100;
}
export function formatPayment(value) {
    if (value === null || value === undefined || value === '') return '—';
    return Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}

export function totalPayments(values) {
    const recorded = values.map(amount).filter(value => value !== null);
    return { value: recorded.length ? recorded.reduce((sum, value) => sum + value, 0) / 100 : null, missing: values.length - recorded.length };
}

export function matchesPaymentMonth(date, month) {
    return !month || (typeof date === 'string' && date.slice(0, 7) === month);
}

export function todayPaymentDate() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// Display recorded tranche dates, not the date a CRM amount happened to be edited.
export function lastCustomerPaymentDate(customer = {}) {
    for (const field of ['second_tranche_date', 'first_tranche_date']) {
        const value = customer[field];
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) continue;
        const date = value.trim();
        const parsed = new Date(`${date}T00:00:00Z`);
        if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) return date;
    }
    return null;
}
