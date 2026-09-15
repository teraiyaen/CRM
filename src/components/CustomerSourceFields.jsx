import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { CUSTOMER_FIELD_GROUPS, MIS_SOURCE_FIELDS } from '../customerSourceFields';
import { paymentLeft, formatPayment } from '../utils/customerPayments';
import CustomerBomDispatchModal from './CustomerBomDispatchModal';
import useOperationNames from '../hooks/useOperationNames';
import { operationNames } from '../utils/operationNames';

const fieldCategories = { dealer: 'channel_partner', panel_brand: 'module_brand', inverter_brand: 'inverter_make' };

function ProjectVendor({ value, onChange, isEditable, onRequestEdit, saving }) {
    const [vendors, setVendors] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        (async () => {
            try {
                const names = [];
                for (let start = 0; ; start += 500) {
                    const { data, error } = await supabase.from('metadata').select('id,label').eq('category', 'installation_vendor').order('id').range(start, start + 499);
                    if (error) throw error;
                    names.push(...(data || []).map(row => row.label).filter(Boolean));
                    if (!data || data.length < 500) break;
                }
                if (!cancelled) setVendors(names);
            } catch (err) { if (!cancelled) setError(err.message); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [refreshKey, isEditable]);
    const options = [...new Set([...vendors, value].filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return <div className="mt-4 space-y-2">
        <label className="block text-xs font-semibold text-stone-600">Project vendor
            {isEditable ? <select disabled={saving || loading || Boolean(error)} value={value || ''} onChange={e => onChange(e.target.value || null)} className="mt-1 block w-full rounded-lg border bg-white p-2 text-sm sm:max-w-sm">
                <option value="">{loading ? 'Loading vendors…' : 'No vendor assigned'}</option>
                {options.map(name => <option key={name} value={name}>{name}</option>)}
            </select> : <p className="mt-1 text-sm text-stone-900">{value || 'No vendor assigned'}</p>}
        </label>
        <div className="flex flex-wrap items-center gap-3">
            {!isEditable && onRequestEdit && <button type="button" disabled={saving} onClick={onRequestEdit} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">{value ? 'Change vendor' : 'Assign vendor'}</button>}
            <button type="button" disabled={loading || saving} onClick={() => setRefreshKey(key => key + 1)} className="text-xs font-semibold underline disabled:opacity-50">Refresh vendors</button>
        </div>
        {!isEditable && <p className="text-xs text-stone-500">{onRequestEdit ? 'This completed project is locked. Assign or change its vendor to unlock editing, then choose Save Details.' : 'This completed project is locked. An admin can unlock it to assign a vendor.'}</p>}
        {isEditable && <p className="text-xs text-stone-500">Choose a vendor, then click Save Details. Projects with a saved vendor assignment appear in Installation Payments.</p>}
        {!loading && !error && vendors.length === 0 && <p className="text-xs text-stone-500">Add installation vendor names in Operations, then click Refresh vendors.</p>}
        {error && <p role="alert" className="text-xs text-red-700">Vendors could not be loaded: {error}</p>}
    </div>;
}

export default function CustomerSourceFields({ activeTab, customer, editData, handleChange, isEditable, onRequestEdit, saving }) {
    const group = CUSTOMER_FIELD_GROUPS[activeTab] ? activeTab : 'basic';
    const choices = useOperationNames();
    const [mis, setMis] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showBom, setShowBom] = useState(false);
    useEffect(() => {
        let cancelled = false;
        setMis(null); setError('');
        if (!customer?.application_number) return;
        setLoading(true);
        (async () => {
            try {
                const { data, error } = await supabase.from('mis').select('*').eq('application_number', customer.application_number).limit(2);
                if (error) throw error;
                if (data?.length > 1) throw new Error('Multiple MIS records match this application. Review the MIS import.');
                if (!cancelled) setMis(data?.[0] || null);
            } catch (err) { if (!cancelled) setError(err.message); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [customer?.application_number]);
    return <div className="space-y-5">
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-white p-5">
            {choices.error && <p role="alert" className="mb-3 text-xs text-red-700">Saved Operations names could not be loaded: {choices.error}</p>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{CUSTOMER_FIELD_GROUPS[group].map(({key,label,type}) => <label key={key} className="space-y-1 text-xs font-semibold text-stone-600">
                <span>{label}</span>
                {type === 'calculated' ? <output className="block rounded-lg bg-amber-50 p-2 text-sm font-bold text-stone-900" title="Quotation amount minus amount received">{formatPayment(paymentLeft(editData.actual_payment, editData.payment))}</output> : !isEditable || key === 'sources' ? <p className="rounded-lg bg-stone-50 p-2 text-sm text-stone-900">{editData[key] === null || editData[key] === undefined || editData[key] === '' ? '—' : String(editData[key])}</p> : fieldCategories[key] ? <select disabled={choices.loading || Boolean(choices.error)} className="block w-full rounded-lg border border-amber-200 bg-white p-2 text-sm text-stone-900 focus:ring-2 focus:ring-amber-400" value={editData[key] ?? ''} onChange={e => handleChange(key, e.target.value || null)}><option value="">{choices.loading ? 'Loading names…' : 'Select ' + label.toLowerCase()}</option>{operationNames(choices.rows, fieldCategories[key], editData[key]).map(name => <option key={name} value={name}>{name}</option>)}</select> : type === 'boolean' ? <select className="block w-full rounded-lg border p-2" value={editData[key] == null ? '' : String(editData[key])} onChange={e => handleChange(key, e.target.value === '' ? null : e.target.value === 'true')}><option value="">Not recorded</option><option value="true">Yes</option><option value="false">No</option></select> : <input className="block w-full rounded-lg border p-2 text-sm text-stone-900" type={type} step={type === 'number' ? 'any' : undefined} value={editData[key] ?? ''} onChange={e => handleChange(key,e.target.value)} />}
            </label>)}</div>
            {group === 'basic' && <ProjectVendor value={editData.installation_vendor} onChange={value => handleChange('installation_vendor', value)} isEditable={isEditable} onRequestEdit={onRequestEdit} saving={saving} />}
        </section>
        {group === 'technical' && <button className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white" onClick={() => setShowBom(true)}>Solar Material List</button>}
        <details className="rounded-2xl border bg-white p-5">
            <summary className="cursor-pointer text-sm font-bold">PM Surya Ghar MIS · all source fields</summary>
            {loading ? <p className="mt-3 text-sm">Loading MIS…</p> : error ? <p role="alert" className="mt-3 text-sm text-red-700">MIS could not be loaded: {error}</p> : !mis ? <p className="mt-3 text-sm text-stone-500">No matching MIS record is available.</p> : <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{MIS_SOURCE_FIELDS.map(key => <div key={key}><dt className="text-xs font-semibold text-stone-500">{key.replaceAll('_',' ')}</dt><dd className="break-words text-sm">{mis[key] ?? '—'}</dd></div>)}</dl>}
        </details>
        <CustomerBomDispatchModal isOpen={showBom} onClose={() => setShowBom(false)} initialCustomer={customer} />
    </div>;
}
