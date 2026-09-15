import { useEffect, useId, useState } from 'react';
import { supabase } from '../supabase';
import { COLLECTED_REFERRING_AGENTS } from '../utils/collectedReferringAgents';

export default function ReferringAgentSelect({ value = '', onChange, disabled = false, label = 'Referring agent' }) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [names,setNames] = useState(COLLECTED_REFERRING_AGENTS);
    const [error,setError] = useState('');
    const [loading,setLoading] = useState(true);
    const [revision,setRevision] = useState(0);
    useEffect(() => {
        let cancelled=false;
        setLoading(true);setError('');
        (async()=>{
            try {
                const next = new Set(COLLECTED_REFERRING_AGENTS);
                for(const table of ['admin','leads']) {
                    for(let start=0;;start+=500) {
                        const {data,error}=await supabase.from(table).select('id,ref_agent').order('id').range(start,start+499);
                        if(error)throw error;
                        for(const row of data || []) if(row.ref_agent?.trim())next.add(row.ref_agent.trim());
                        if(!data || data.length<500)break;
                    }
                }
                for(let start=0;;start+=500) {
                    const {data,error}=await supabase.from('metadata').select('id,label').eq('category','ref_agent').order('id').range(start,start+499);
                    if(error)throw error;
                    for(const row of data || []) if(row.label?.trim())next.add(row.label.trim());
                    if(!data || data.length<500)break;
                }
                if(!cancelled)setNames([...next].sort((a,b)=>a.localeCompare(b)));
            } catch(err) {if(!cancelled)setError(err.message);}
            finally {if(!cancelled)setLoading(false);}
        })();
        return ()=>{cancelled=true;};
    },[revision]);
    const options=[...new Set([...names,value].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const filtered = options.filter(name => name.toLowerCase().includes(search.trim().toLowerCase()));
    function choose(name) {
        onChange(name);
        setOpen(false);
        setSearch('');
        document.getElementById(id)?.focus();
    }
    return <div className="space-y-1 relative" onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); document.getElementById(id)?.focus(); }
    }}>
        <label id={`${id}-label`} htmlFor={id} className="block text-xs font-semibold text-stone-700">{label}</label>
        <button id={id} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open && !disabled} aria-controls={`${id}-names`}
            onClick={() => { setSearch(''); setOpen(!open); }}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-left text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50">
            <span>{value || 'Select referring agent'}</span><span aria-hidden="true">▾</span>
        </button>
        {open && !disabled && <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
            <input autoFocus type="search" autoComplete="off" aria-label="Search referring agents" value={search}
                onChange={event => setSearch(event.target.value)}
                onKeyDown={event => {
                    if (event.key === 'ArrowDown') { event.preventDefault(); document.getElementById(`${id}-names`)?.querySelector('button')?.focus(); }
                    if (event.key === 'Enter') { event.preventDefault(); if (filtered.length === 1) choose(filtered[0]); }
                }}
                placeholder="Search names…" className="mb-2 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            <div id={`${id}-names`} role="listbox" aria-labelledby={`${id}-label`} className="max-h-56 overflow-y-auto"
                onKeyDown={event => {
                    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault();
                    const buttons = [...event.currentTarget.querySelectorAll('button')];
                    const index = buttons.indexOf(document.activeElement);
                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
                    buttons[next]?.focus();
                }}>
                <button type="button" role="option" aria-selected={!value} onClick={() => choose('')} className="block w-full rounded px-3 py-2 text-left text-sm text-stone-500 hover:bg-brand-50 focus:bg-brand-50">Not assigned</button>
                {filtered.map(name => <button key={name} type="button" role="option" aria-selected={value === name} onClick={() => choose(name)}
                    className={`block w-full rounded px-3 py-2 text-left text-sm hover:bg-brand-50 focus:bg-brand-50 ${value === name ? 'bg-brand-50 font-semibold text-brand-800' : 'text-stone-800'}`}>{name}</button>)}
            </div>
            {!filtered.length && <p className="px-3 py-2 text-sm text-stone-500">No matching agents. Add a name in Operations.</p>}
        </div>}
        <div className="flex items-center justify-between gap-2"><p className="text-xs text-stone-500">{loading?'Loading saved names…':'Select a name, or add one in Operations.'}</p><button type="button" disabled={disabled || loading} onClick={()=>setRevision(n=>n+1)} className="text-xs font-semibold text-brand-700 underline disabled:opacity-50">Refresh</button></div>
        {error&&<p role="status" className="text-xs text-amber-800">Showing collected names. Live names could not be loaded: {error}</p>}
    </div>;
}
