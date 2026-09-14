import { AGREEMENT_COMPANY, PLACEHOLDER_VENDOR_STAMP } from '../agreementCompany';

export function stampDetailsFromCustomer(customer = {}, mis = {}) {
    return {
        consumerName: customer.consumer_name || mis.consumer_name || '',
        consumerNo: customer.consumer_number || mis.consumer_number || '',
        address: customer.address || mis.consumer_address || '',
        village: '',
        taluka: '',
        district: mis.district_name || '',
        state: mis.state_name || '',
        executionDate: '',
        vendorName: AGREEMENT_COMPANY.name,
        vendorAddress: AGREEMENT_COMPANY.address,
        firstPartySignature: '', secondPartyStamp: PLACEHOLDER_VENDOR_STAMP, secondPartySignature: '',
        gpaStampUrl: '', showHighlights: false, highlightColor: '#fef08a',
    };
}
export function agreementDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return '';
    return date.split('-').reverse().join('-');
}
