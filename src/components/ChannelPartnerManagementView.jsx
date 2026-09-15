import { useRef, useState } from 'react';
import { Plus, Wrench, Users, Sun, Zap, RefreshCw, Check } from 'lucide-react';
import { supabase } from '../supabase';
import useOperationNames from '../hooks/useOperationNames';
import { operationNames } from '../utils/operationNames';

const sections = [
    { key: 'installation_vendor', title: 'Installation vendors', singular: 'vendor', description: 'Teams that install your projects', icon: Wrench, tint: 'bg-violet-50 border-violet-200', badge: 'bg-violet-100 text-violet-800', button: 'bg-violet-700 hover:bg-violet-800' },
    { key: 'channel_partner', title: 'Dealers', singular: 'dealer', description: 'Your sales and channel partners', icon: Users, tint: 'bg-sky-50 border-sky-200', badge: 'bg-sky-100 text-sky-800', button: 'bg-sky-700 hover:bg-sky-800' },
    { key: 'module_brand', title: 'Panel brands', singular: 'panel brand', description: 'Solar module manufacturers', icon: Sun, tint: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-900', button: 'bg-amber-700 hover:bg-amber-800' },
    { key: 'inverter_make', title: 'Inverter brands', singular: 'inverter brand', description: 'Inverter manufacturers', icon: Zap, tint: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', button: 'bg-emerald-700 hover:bg-emerald-800' },
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
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-white p-6">
            <div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Manage your business</p><h2 className="mt-1 text-2xl font-bold text-stone-900">Operations</h2><p className="mt-2 text-sm text-stone-600">Vendors, dealers and equipment brands, all in one place.</p></div>
            <button type="button" disabled={loading || busy} onClick={refresh} className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-50"><RefreshCw size={15}/>Refresh</button>
        </header>
        {loadError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Saved names could not be loaded: {loadError}. Refresh to try again.</p>}
        {notice && <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><Check size={16}/>{notice}</p>}
        <div className="grid gap-5 md:grid-cols-2">{sections.map(({ key,title,singular,description,icon: Icon,tint,badge,button }) => {
            const names = operationNames(rows, key);
            return <section key={key} className={`overflow-hidden rounded-2xl border shadow-sm ${tint}`}>
                <div className="flex items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${badge}`}><Icon size={22}/></span><div><h3 className="font-bold text-stone-900">{title} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${badge}`}>{names.length}</span></h3><p className="mt-1 text-xs text-stone-600">{description}</p></div></div>
                    {canEdit && <button type="button" aria-label={`Add ${singular}`} aria-expanded={category===key} disabled={busy || loading || Boolean(loadError)} onClick={()=>{setCategory(key);setName('');setError('');}} className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${button}`}><Plus size={16}/>Add</button>}
                </div>
                <div className="min-h-36 border-t border-white/70 bg-white/80 p-5">
                    {category===key && <form onSubmit={addName} className="mb-4 rounded-xl border border-stone-200 bg-white p-3"><label className="block text-xs font-semibold text-stone-700" htmlFor={`operation-${key}`}>New {singular}</label><div className="mt-2 flex flex-wrap gap-2"><input id={`operation-${key}`} autoFocus required maxLength={150} disabled={busy} className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder={`Enter ${singular} name`} value={name} onChange={e=>setName(e.target.value)}/><button disabled={busy || loading || Boolean(loadError)} className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${button}`}>{busy?'Saving…':'Save'}</button><button type="button" disabled={busy} onClick={()=>{setCategory(null);setError('');}} className="px-2 text-sm text-stone-600">Cancel</button></div>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}</form>}
                    {loading && <p className="mb-3 text-xs text-stone-500">Loading saved names…</p>}
                    <ul className="flex flex-wrap gap-2">{names.map(label=><li key={label} className={`rounded-lg border border-white px-3 py-2 text-sm font-medium ${badge}`}>{label}</li>)}</ul>
                    {!loading && !loadError && !names.length && <p className="text-sm text-stone-500">No {title.toLowerCase()} yet.{canEdit ? ' Use + Add to create one.' : ''}</p>}
                </div>
            </section>;
        })}</div>
        <p className="text-xs text-stone-500">Brand choices include names from the collected project data. New names saved here are available in customer and lead forms.</p>
    </div>;
}
