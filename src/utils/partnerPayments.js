export const PARTNER_PAYMENT_CONFIG = {
    vendor: { title: 'Installation Payments', label: 'Vendor', name: 'installation_vendor', category: 'installation_vendor', amount: 'vendor_payment_amount', status: 'vendor_payment_status', date: 'vendor_payment_date' },
    dealer: { title: 'Dealer Payments', label: 'Dealer', name: 'dealer', category: 'channel_partner', amount: 'dealer_payment_amount', status: 'dealer_payment_status', date: 'dealer_payment_date' },
};
export function partnerPaymentPatch(config, draft) {
    const name = String(draft.name || '').trim();
    const raw = String(draft.amount ?? '').trim();
    if (!name) throw new Error(`Select a ${config.label.toLowerCase()}.`);
    if (!/^\d+(\.\d{1,2})?$/.test(raw) || !Number.isFinite(Number(raw)) || Number(raw) > 999999999999.99) {
        throw new Error('Enter a non-negative payment amount with up to two decimal places.');
    }
    if (!['Paid', 'Unpaid'].includes(draft.status)) throw new Error('Choose Paid or Unpaid.');
    if (draft.status === 'Paid') {
        const date = new Date(`${draft.date}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date || '') || Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== draft.date) {
            throw new Error('Enter a valid payment date.');
        }
    }
    return { [config.name]: name, [config.amount]: Number(raw), [config.status]: draft.status, [config.date]: draft.status === 'Paid' ? draft.date : null };
}
