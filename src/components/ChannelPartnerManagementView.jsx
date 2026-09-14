import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function ChannelPartnerManagementView({ currentUser }) {
    const [rows, setRows] = useState([]);
    const [category, setCategory] = useState('installation_vendor');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        supabase.from('metadata').select('id,category,label').in('category',['installation_vendor','channel_partner']).order('label').then(({ data,error }) => {
            if (!active) return;
            if (error) setError(error.message); else setRows(data || []);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);
    async function addName(event) {
        event.preventDefault();
        if (currentUser?.userType !== 'admin' || !name.trim() || busy) return;
        if (rows.some(row => row.category === category && row.label.trim().toLowerCase() === name.trim().toLowerCase())) { setError('This name already exists.'); return; }
        setBusy(true); setError('');
        try {
            const {data,error} = await supabase.from('metadata').insert({category,label:name.trim()}).select('id,category,label').single();
            if (error) throw error;
            if (!data) throw new Error('The name was not saved.');
            setRows(previous => [...previous,data].sort((a,b) => a.label.localeCompare(b.label))); setName('');
        } catch(err) { setError(err.message); } finally { setBusy(false); }
    }
    return <div className="space-y-5">
        <section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Operations</h2><p className="mt-1 text-sm text-stone-500">Manage installation vendors and dealers.</p>
            <form onSubmit={addName} className="mt-4 flex flex-wrap gap-3"><label className="text-xs">Type<select className="mt-1 block rounded-lg border p-2" value={category} onChange={e=>setCategory(e.target.value)}><option value="installation_vendor">Installation vendor</option><option value="channel_partner">Dealer</option></select></label><label className="text-xs">Name<input required className="mt-1 block rounded-lg border p-2" value={name} onChange={e=>setName(e.target.value)} /></label><button disabled={busy || loading} className="self-end rounded-lg bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Saving…' : 'Add name'}</button></form>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        </section>
        <div className="grid gap-4 md:grid-cols-2">{[['installation_vendor','Installation vendors'],['channel_partner','Dealers']].map(([key,title]) => <section key={key} className="rounded-2xl border bg-white p-5"><h3 className="font-bold">{title}</h3>{loading ? <p>Loading…</p> : <ul className="mt-3 space-y-2 text-sm">{rows.filter(row=>row.category===key).map(row=><li key={row.id}>{row.label}</li>)}</ul>}{!loading && !rows.some(row=>row.category===key) && <p className="mt-3 text-sm text-stone-500">No names recorded yet.</p>}</section>)}</div>
    </div>;
}
