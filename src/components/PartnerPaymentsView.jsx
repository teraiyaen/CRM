import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { formatPayment, totalPayments, matchesPaymentMonth, todayPaymentDate } from '../utils/customerPayments';
import { PARTNER_PAYMENT_CONFIG, partnerPaymentPatch } from '../utils/partnerPayments';

const inputClass = 'block w-full rounded-lg border border-stone-300 bg-white p-2 text-sm';
export default function PartnerPaymentsView({ kind = 'vendor', currentUser, onSelectCustomer }) {
    const config = PARTNER_PAYMENT_CONFIG[kind];
    const columns = `*,${config.name},${config.amount},${config.status},${config.date}`;
    const [rows, setRows] = useState([]);
    const [names, setNames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [partner, setPartner] = useState('');
    const [month, setMonth] = useState('');
    const [status, setStatus] = useState('');
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState({});
    const [saveError, setSaveError] = useState('');
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const requestId = useRef(0);
    const savingRef = useRef(false);
    const canEdit = currentUser?.userType === 'admin';
    const load = useCallback(async () => {
        const request = ++requestId.current;
        setLoading(true); setError('');
        try {
            const nextRows = [];
            for (let start = 0; ; start += 500) {
                const { data, error } = await supabase.from('admin').select(columns).order('id').range(start,start+499);
                if (error) throw error;
                nextRows.push(...(data || []));
                if (!data || data.length < 500) break;
            }
            const nextNames = [];
            for (let start = 0; ; start += 500) {
                const { data, error } = await supabase.from('metadata').select('id,label').eq('category',config.category).order('id').range(start,start+499);
                if (error) throw error;
                nextNames.push(...(data || []).map(row => row.label));
                if (!data || data.length < 500) break;
            }
            if (request !== requestId.current) return;
            setRows(nextRows);
            setNames([...new Set([...nextNames, ...nextRows.map(row=>row[config.name])].filter(Boolean))].sort((a,b)=>a.localeCompare(b)));
        } catch (err) {
            if (request === requestId.current) { setError(err.message); setRows([]); }
        } finally { if (request === requestId.current) setLoading(false); }
    }, [columns, config]);
    useEffect(() => { load(); return () => { requestId.current += 1; }; }, [load]);
    const filtered = useMemo(() => rows.filter(row =>
        (kind !== 'vendor' || Boolean(row[config.name]?.trim())) &&
        matchesPaymentMonth(row[config.date], month) &&
        (!partner || row[config.name] === partner) &&
        (!status || (row[config.status] || 'Not recorded') === status) &&
        `${row.consumer_name || ''} ${row.consumer_number || ''}`.toLowerCase().includes(search.toLowerCase())
    ), [rows, partner, status, search, config, kind, month]);
    const combined = totalPayments(filtered.map(row => row[config.amount]));
    const totals = filtered.reduce((sum,row) => {
        if (row[config.status] === 'Paid') sum.paid += Math.round(Number(row[config.amount] || 0)*100);
        else if (row[config.status] === 'Unpaid') sum.unpaid += Math.round(Number(row[config.amount] || 0)*100);
        else sum.unrecorded += 1;
        return sum;
    }, {paid:0,unpaid:0,unrecorded:0});
    function openEditor(row) {
        setEditing(row); setSaveError(''); setNotice('');
        setDraft({ name: row[config.name] || '', amount: row[config.amount] ?? '', status: row[config.status] || 'Unpaid', date: row[config.date] || todayPaymentDate() });
    }
    async function save(event) {
        event.preventDefault();
        if (!canEdit || savingRef.current) return;
        setSaveError('');
        let patch;
        try { patch = partnerPaymentPatch(config,draft); } catch (err) { setSaveError(err.message); return; }
        savingRef.current = true; setSaving(true);
        try {
            let query = supabase.from('admin').update({ ...patch, updated_at: new Date().toISOString() }).eq('id',editing.id);
            query = editing.updated_at ? query.eq('updated_at',editing.updated_at) : query.is('updated_at',null);
            const {data,error} = await query.select(columns).maybeSingle();
            if (error) throw error;
            if (!data) throw new Error('Nothing was saved. This customer may have changed or your account may not have permission. Close this form and refresh before trying again.');
            setRows(previous=>previous.map(row=>row.id===data.id?data:row));
            setEditing(null); setNotice('Payment record saved.');
            try {
                const { error: logError } = await supabase.from('activity_log').insert({ user_id: currentUser.id, customer_id: data.id, action: 'update', message: `${data.consumer_name}: ${config.label} payment ${patch[config.status]} — ${patch[config.name]}, ${formatPayment(patch[config.amount])}${patch[config.date] ? `, ${patch[config.date]}` : ''}`, new_value: JSON.stringify(patch) });
                if (logError) throw logError;
            } catch { setNotice('Payment saved, but its activity log entry could not be recorded.'); }
        } catch(err) { setSaveError(err.message); }
        finally { savingRef.current = false; setSaving(false); }
    }
    return <section className="space-y-4">
        <div className="flex justify-between gap-3"><h2 className="text-lg font-bold">{config.title}</h2><button className="rounded-lg border px-3 py-2 text-sm" onClick={load} disabled={loading}>Refresh</button></div>
        <p className="text-sm text-stone-600">Enter the payment amount manually for each customer. Add {config.label.toLowerCase()} names in Operations. Existing customers remain “Not recorded” until a payment record is entered.</p>
        {kind === 'vendor' && <p className="text-sm text-stone-600">Only projects with a vendor assigned in Basic Info appear here.</p>}
        {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
        <div className="flex flex-wrap gap-3"><input aria-label="Search payment customers" className={inputClass+' sm:max-w-xs'} placeholder="Customer or consumer number" value={search} onChange={e=>setSearch(e.target.value)} /><select aria-label={`${config.label} filter`} className={inputClass+' sm:max-w-xs'} value={partner} onChange={e=>setPartner(e.target.value)}><option value="">All {config.label.toLowerCase()}s</option>{names.map(name=><option key={name}>{name}</option>)}</select><select aria-label="Payment status filter" className={inputClass+' sm:max-w-xs'} value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{['Paid','Unpaid','Not recorded'].map(value=><option key={value}>{value}</option>)}</select></div>
        <div className="flex flex-wrap items-end gap-3"><label className="text-sm">Payment month<input type="month" className={inputClass} value={month} onChange={e=>setMonth(e.target.value)}/></label><button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>setMonth('')}>All months</button></div>
        <p className="text-xs text-stone-500">Combined amounts follow the selected {config.label.toLowerCase()}, month, status and search. Month uses the payment date; unpaid or undated records appear under All months.</p>
        {loading ? <p>Loading payment records…</p> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>Payment records could not be loaded: {error}</p><p className="mt-2">If the new payment columns are missing, run add_manual_partner_payments.sql in Supabase, then refresh.</p></div> : <>
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5"><p className="text-sm font-semibold">Combined amount · {partner || `All ${config.label.toLowerCase()}s`} · {filtered.length} projects</p><p className="mt-1 text-xl font-bold">{formatPayment(combined.value)}</p>{combined.missing>0&&<p className="text-xs text-amber-800">{combined.missing} missing amounts excluded</p>}</div>
            <div className="grid gap-3 sm:grid-cols-3">{[['Paid',formatPayment(totals.paid/100)],['Unpaid',formatPayment(totals.unpaid/100)],['Not recorded',totals.unrecorded]].map(([label,value])=><div key={label} className={`rounded-2xl border p-4 ${label === 'Paid' ? 'border-emerald-200 bg-emerald-50' : label === 'Unpaid' ? 'border-orange-200 bg-orange-50' : 'border-sky-200 bg-sky-50'}`}><p className="text-xs font-semibold text-stone-600">{label} · current filters</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}</div>
            <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-amber-50 text-amber-900"><tr>{['Customer',config.label,'Amount','Status','Payment date','Actions'].map((label,index)=><th key={index} className="p-3">{label}</th>)}</tr></thead><tbody>{filtered.map(row=><tr key={row.id} className="border-t"><td className="p-3"><button className="text-left font-semibold underline" onClick={()=>onSelectCustomer?.(row)}>{row.consumer_name || row.consumer_number}</button><p className="text-xs text-stone-500">{row.consumer_number}</p></td><td className="p-3">{row[config.name] || '—'}</td><td className="whitespace-nowrap p-3">{formatPayment(row[config.amount])}</td><td className="p-3">{row[config.status] || 'Not recorded'}</td><td className="p-3">{row[config.date] || '—'}</td><td className="p-3">{canEdit && <button className="rounded-lg border px-3 py-1" onClick={()=>openEditor(row)}>Edit payment</button>}</td></tr>)}{!filtered.length && <tr><td colSpan={6} className="p-5 text-stone-500">No matching customers.</td></tr>}</tbody></table></div>
        </>}
        {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form role="dialog" aria-modal="true" aria-labelledby="partner-payment-title" onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><h3 id="partner-payment-title" className="font-bold">{config.label} payment · {editing.consumer_name}</h3>
            <label className="block text-sm">{config.label}<select required disabled={saving} className={inputClass} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}><option value="">Select {config.label.toLowerCase()}</option>{names.map(name=><option key={name}>{name}</option>)}</select></label>
            {!names.length && <p className="text-sm text-amber-800">Add a name in Operations first.</p>}
            <label className="block text-sm">Payment amount (₹)<input required disabled={saving} type="number" min="0" step="0.01" className={inputClass} value={draft.amount} onChange={e=>setDraft({...draft,amount:e.target.value})} /></label>
            <label className="block text-sm">Payment status<select disabled={saving} className={inputClass} value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value,date:e.target.value==='Unpaid'?'':(draft.date||todayPaymentDate())})}><option>Unpaid</option><option>Paid</option></select></label>
            {draft.status==='Paid' && <label className="block text-sm">Payment date<input required disabled={saving} type="date" className={inputClass} value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})} /></label>}
            {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
            <div className="flex justify-end gap-3"><button type="button" disabled={saving} className="rounded-lg border px-4 py-2" onClick={()=>setEditing(null)}>Cancel</button><button disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-white disabled:opacity-50">{saving?'Saving…':'Save payment'}</button></div>
        </form></div>}
    </section>;
}
