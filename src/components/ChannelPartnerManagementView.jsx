import { useRef, useState } from 'react';
import { Plus, Wrench, Users, Sun, Zap, RefreshCw, Check } from 'lucide-react';
import { supabase } from '../supabase';
import useOperationNames from '../hooks/useOperationNames';
import { operationNames } from '../utils/operationNames';

const sections = [
    { key: 'ref_agent', title: 'Referring agents', singular: 'referring agent', description: 'People and partners who refer customers', icon: Users },
    { key: 'installation_vendor', title: 'Installation vendors', singular: 'vendor', description: 'Teams that install your projects', icon: Wrench, tint: 'bg-white border-stone-200', badge: 'bg-brand-100 text-brand-800', button: 'bg-brand-700 hover:bg-brand-800' },
    { key: 'channel_partner', title: 'Dealers', singular: 'dealer', description: 'Your sales and channel partners', icon: Users, tint: 'bg-white border-stone-200', badge: 'bg-brand-100 text-brand-800', button: 'bg-brand-700 hover:bg-brand-800' },
    { key: 'module_brand', title: 'Panel brands', singular: 'panel brand', description: 'Solar module manufacturers', icon: Sun, tint: 'bg-white border-stone-200', badge: 'bg-amber-100 text-amber-900', button: 'bg-amber-700 hover:bg-amber-800' },
    { key: 'inverter_make', title: 'Inverter brands', singular: 'inverter brand', description: 'Inverter manufacturers', icon: Zap, tint: 'bg-white border-stone-200', badge: 'bg-brand-100 text-brand-800', button: 'bg-brand-700 hover:bg-brand-800' },
];
export default function ChannelPartnerManagementView({ currentUser }) {
    const { rows, setRows, loading, error: loadError, refresh } = useOperationNames();
    const [category, setCategory] = useState(null);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const saveLock = useRef(false);
    const canEdit = currentUser?.userType === 'admin';
    async function addName(event) {
        event.preventDefault();
        if (!canEdit || !name.trim() || saveLock.current || loading || loadError) return;
        if (operationNames(rows, category).some(label => label.toLowerCase() === name.trim().toLowerCase())) { setError('This name is already available in this section.'); return; }
        saveLock.current = true; setBusy(true); setError(''); setNotice('');
        try {
            const {data,error} = await supabase.from('metadata').insert({category,label:name.trim()}).select('id,category,label').single();
            if (error) throw error;
            if (!data) throw new Error('The name was not saved.');
            setRows(previous => [...previous,data]);
            setNotice(`${data.label} added to ${sections.find(section=>section.key===category).title.toLowerCase()}.`);
            setName(''); setCategory(null);
        } catch(err) { setError(err.message); }
        finally { saveLock.current = false; setBusy(false); }
    }
    return <div className="space-y-5">
        <header className="crm-page-header flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-sunshine-50 to-white p-6">
            <div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Manage your business</p><h2 className="mt-1 text-2xl font-bold text-stone-900">Operations</h2><p className="mt-2 text-sm text-stone-600">Manage vendors, dealers, referring agents and equipment brands.</p></div>
            <button type="button" disabled={loading || busy} onClick={refresh} className="flex items-center gap-2 rounded-xl border border-amber-200 crm-surface bg-white px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-50"><RefreshCw size={15}/>Refresh</button>
        </header>
        {loadError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Saved names could not be loaded: {loadError}. Refresh to try again.</p>}
        {notice && <p role="status" className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800"><Check size={16}/>{notice}</p>}
        <div className="operations-grid">{sections.map(({ key,title,singular,description,icon: Icon }) => {
            const names = operationNames(rows, key);
            return <section key={key} className="operations-section">
                <div className="operations-section-heading">
                    <div className="flex items-center gap-3"><span className="operations-icon"><Icon size={18}/></span><div><h3 className="font-bold text-stone-900">{title} <span className="operations-count">{names.length}</span></h3><p className="mt-1 text-xs text-stone-600">{description}</p></div></div>
                    {canEdit && <button type="button" aria-label={`Add ${singular}`} aria-expanded={category===key} disabled={busy || loading || Boolean(loadError)} onClick={()=>{setCategory(key);setName('');setError('');}} className="crm-primary-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold disabled:opacity-50"><Plus size={16}/>Add</button>}
                </div>
                <div className="operations-section-body">
                    {category===key && <form onSubmit={addName} className="mb-4 rounded-xl border border-stone-200 crm-surface bg-white p-3"><label className="block text-xs font-semibold text-stone-700" htmlFor={`operation-${key}`}>New {singular}</label><div className="mt-2 flex flex-wrap gap-2"><input id={`operation-${key}`} autoFocus required maxLength={150} disabled={busy} className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder={`Enter ${singular} name`} value={name} onChange={e=>setName(e.target.value)}/><button disabled={busy || loading || Boolean(loadError)} className="crm-primary-button rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">{busy?'Saving…':'Save'}</button><button type="button" disabled={busy} onClick={()=>{setCategory(null);setError('');}} className="px-2 text-sm text-stone-600">Cancel</button></div>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}</form>}
                    {loading && <p className="mb-3 text-xs text-stone-500">Loading saved names…</p>}
                    <ol className="operations-name-list">{names.map((label,index)=><li key={label}><span className="operations-row-number">{index+1}</span><span>{label}</span></li>)}</ol>
                    {!loading && !loadError && !names.length && <p className="text-sm text-stone-500">No {title.toLowerCase()} yet.{canEdit ? ' Use + Add to create one.' : ''}</p>}
                </div>
            </section>;
        })}</div>
        <p className="text-xs text-stone-500">Brand and referring-agent choices include names from the collected project data. New names saved here are available in customer and lead forms.</p>
    </div>;
}
