import assert from 'node:assert/strict';
import { lastCustomerPaymentDate } from '../src/utils/customerPayments.js';
assert.equal(lastCustomerPaymentDate({second_tranche_date:'2026-07-10',first_tranche_date:'2026-06-01'}),'2026-07-10');
assert.equal(lastCustomerPaymentDate({second_tranche_date:'',first_tranche_date:'2026-06-01'}),'2026-06-01');
assert.equal(lastCustomerPaymentDate({second_tranche_date:'2026-02-30',first_tranche_date:'2026-06-01'}),'2026-06-01');
assert.equal(lastCustomerPaymentDate({payment_date:'2026-09-15'}),null);
assert.equal(lastCustomerPaymentDate({}),null);
console.log('Last payment date: second tranche, first-tranche fallback, invalid and missing dates passed.');
