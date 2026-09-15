import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { lastCustomerPaymentDate, paymentLeft, formatPayment, totalPayments, matchesPaymentMonth } from '../utils/customerPayments';

export default function CustomerPaymentsView({ onSelectCustomer }) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [month, setMonth] = useState('');
    const [dateField, setDateField] = useState('last_payment_date');
    const [dealerFilter, setDealerFilter] = useState('all');
    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const rows = [];
            for (let start = 0; ; start += 500) {
                const { data, error } = await supabase.from('admin').select('*').order('id').range(start, start + 499);
                if (error) throw error;
                rows.push(...(data || []));
                if (!data || data.length < 500) break;
            }
            setCustomers(rows);
        } catch(err) { setError(err.message); setCustomers([]); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    const dealers = [...new Set(customers.map(customer => customer.dealer?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const rows = customers.filter(customer => {
        const dealer = customer.dealer?.trim() || '';
        const matchesDealer = dealerFilter === 'all' || (dealerFilter === 'unassigned' ? !dealer : dealerFilter === `dealer:${dealer}`);
        return matchesDealer && matchesPaymentMonth(dateField === 'last_payment_date' ? lastCustomerPaymentDate(customer) : customer[dateField], month) && `${customer.consumer_name || ''} ${customer.consumer_number || ''} ${dealer}`.toLowerCase().includes(search.toLowerCase());
    });
    const totals = [
        ['Quotation total', totalPayments(rows.map(row => row.actual_payment))],
        ['Received total', totalPayments(rows.map(row => row.payment))],
        ['Left total', totalPayments(rows.map(row => paymentLeft(row.actual_payment, row.payment)))],
    ];
    return <section className="space-y-4">
        <div className="crm-page-header flex items-center justify-between"><h2 className="text-lg font-bold">Customer Payments</h2><button disabled={loading} onClick={load} className="rounded-lg border px-3 py-2 text-sm">Refresh</button></div>
        <p className="text-sm text-stone-600">Left = quotation amount − amount received. Blank amounts remain unknown; negative values indicate an overpayment or a record to review.</p>
        <input aria-label="Search customer payments" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customer, consumer number or dealer" className="w-full rounded-xl border p-3 text-sm" />
        <label className="block text-sm font-semibold">Dealer
            <select value={dealerFilter} onChange={e=>setDealerFilter(e.target.value)} className="mt-1 block w-full rounded-xl border crm-surface bg-white p-3 text-sm sm:max-w-xs">
                <option value="all">All dealers</option>
                <option value="unassigned">No dealer assigned</option>
                {dealers.map(dealer => <option key={dealer} value={`dealer:${dealer}`}>{dealer}</option>)}
            </select>
        </label>
        <div className="flex flex-wrap gap-3">
            <label className="text-sm">Filter month by<select className="mt-1 block rounded-lg border crm-surface bg-white p-2" value={dateField} onChange={e=>setDateField(e.target.value)}>{[['last_payment_date','Last payment date'],['application_date','Application date'],['submitted_on','Submission date'],['dispatch_date','Dispatch date'],['first_tranche_date','First loan tranche date'],['second_tranche_date','Second loan tranche date']].map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
            <label className="text-sm">Month<input type="month" className="mt-1 block rounded-lg border p-2" value={month} onChange={e=>setMonth(e.target.value)}/></label>
            <button className="self-end rounded-lg border px-3 py-2 text-sm" onClick={()=>setMonth('')}>All months</button>
        </div>
        <p className="text-xs text-stone-500">Totals combine the customers matching your filters. Received amounts are cumulative, not receipts collected during the selected month. Last payment date uses the second tranche date, falling back to the first tranche date. Undated customers are excluded when a month is selected.</p>
        {!loading && !error && <div className="grid gap-3 sm:grid-cols-3">{totals.map(([label,total])=><div key={label} className="rounded-xl border crm-surface bg-white p-4"><p className="text-xs text-stone-500">{label} · {rows.length} customers</p><p className="mt-1 text-lg font-bold">{formatPayment(total.value)}</p>{total.missing>0&&<p className="text-xs text-amber-700">{total.missing} missing amounts excluded</p>}</div>)}</div>}
        {error && <p role="alert" className="text-red-700">Payments could not be loaded: {error}</p>}
        {loading ? <p>Loading payments…</p> : !error && <div className="overflow-x-auto rounded-xl border crm-surface bg-white"><table className="w-full text-left text-sm"><thead className="crm-table-head bg-stone-100"><tr>{['Customer','Consumer number','Dealer','Quotation amount','Amount received','Last payment date','Left'].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{rows.map(customer => {
            const left = paymentLeft(customer.actual_payment, customer.payment);
            return <tr key={customer.id} className="border-t"><td className="p-3"><button className="text-left font-semibold underline" onClick={()=>onSelectCustomer(customer)}>{customer.consumer_name || 'Unnamed customer'}</button></td><td className="p-3">{customer.consumer_number}</td><td className="p-3">{customer.dealer || '—'}</td><td className="whitespace-nowrap p-3">{formatPayment(customer.actual_payment)}</td><td className="whitespace-nowrap p-3">{formatPayment(customer.payment)}</td><td className="whitespace-nowrap p-3">{lastCustomerPaymentDate(customer) || '—'}</td><td className={`whitespace-nowrap p-3 font-bold ${left !== null && left < 0 ? 'text-red-700' : ''}`}>{formatPayment(left)}</td></tr>;
        })}{!rows.length && <tr><td colSpan={7} className="p-5 text-stone-500">No matching customers.</td></tr>}</tbody></table></div>}
    </section>;
}
