import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import GodownStockHistory from './GodownStockHistory';
import SavedDocumentsView from './SavedDocumentsView';
import CustomerBomDispatchModal from './CustomerBomDispatchModal';

export default function GodownInventoryView() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showBom, setShowBom] = useState(false);
    const [tab,setTab] = useState('stock');
    const [editor,setEditor] = useState(null);
    const [draft,setDraft] = useState({});
    const [saving,setSaving] = useState(false);
    const [saveError,setSaveError] = useState('');
    const [refreshKey,setRefreshKey] = useState(0);
    const request = useRef(null);
    function edit(item) {setEditor(item || {});setDraft({name:item?.material_description||'',unit:item?.unit||'PCS',category:item?.category||'General',quantity:''});setSaveError('');request.current=crypto.randomUUID();}
    async function save(event) {
        event.preventDefault();if(saving)return;
        const quantity=Number(draft.quantity);
        if(!draft.quantity || !Number.isFinite(quantity) || quantity<=0) {setSaveError('Enter a quantity greater than zero.');return;}
        setSaving(true);setSaveError('');
        try {
            const {data,error}=await supabase.rpc('crm_receive_stock',{p_request:request.current,p_item:editor.id||null,p_name:draft.name.trim(),p_unit:draft.unit.trim(),p_category:draft.category.trim(),p_quantity:quantity});
            if(error)throw error;if(!data?.id)throw new Error('Stock was not saved.');
            setEditor(null);await load();
        }catch(err){setSaveError(err.message);}finally{setSaving(false);}
    }
    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const rows = [];
            for (let start = 0; ; start += 500) {
                const { data, error } = await supabase.from('godown_inventory').select('*').order('sr_no').order('id').range(start,start+499);
                if (error) throw error;
                rows.push(...(data || []));
                if (!data || data.length < 500) break;
            }
            setItems(rows);
        } catch(err) { setError(err.message); setItems([]); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = items.filter(item => `${item.material_description} ${item.category || ''}`.toLowerCase().includes(search.toLowerCase()));
    return <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Godown Stock</h2><div className="flex gap-3"><button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>edit(null)}>Add item</button><button className="rounded-lg border px-3 py-2 text-sm" onClick={load} disabled={loading}>Refresh</button><button className="rounded-lg bg-stone-900 px-3 py-2 text-sm text-white" onClick={()=>setShowBom(true)}>Create BOM</button></div></div>
        <div className="flex gap-3"><button className={`rounded-lg border px-4 py-2 ${tab==='stock'?'bg-stone-900 text-white':''}`} onClick={()=>setTab('stock')}>Stock</button><button className={`rounded-lg border px-4 py-2 ${tab==='bom'?'bg-stone-900 text-white':''}`} onClick={()=>setTab('bom')}>View / Download BOMs</button><button className={`rounded-lg border px-4 py-2 ${tab==='history'?'bg-stone-900 text-white':''}`} onClick={()=>setTab('history')}>Stock history</button></div>
        {tab==='bom'?<SavedDocumentsView refreshKey={refreshKey}/>:tab==='history'?<GodownStockHistory refreshKey={refreshKey}/>:<>
        <p className="text-sm text-stone-500">Add a material or receive more stock using Add stock on its row. Sample records are explicitly labelled.</p>
        <input aria-label="Search materials" placeholder="Search materials or category" className="w-full rounded-xl border p-3 text-sm" value={search} onChange={e=>setSearch(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-700">Stock could not be loaded: {error}</p>}
        {loading ? <p>Loading stock…</p> : !error && <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-stone-100"><tr>{['SR','Material','Category','Unit','In stock','Dispatched','Remarks',''].map(label=><th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{filtered.map(item=><tr className="border-t" key={item.id}>{['sr_no','material_description','category','unit','in_stock','dispatched_qty','remarks'].map(key=><td className="p-3" key={key}>{item[key] ?? '—'}{key==='material_description'&&item.is_sample&&<span className="ml-2 rounded bg-amber-100 px-2 py-1 text-xs">Sample data</span>}</td>)}<td className="p-3"><button className="whitespace-nowrap rounded-lg border px-3 py-1" onClick={()=>edit(item)}>Add stock</button></td></tr>)}{filtered.length===0 && <tr><td colSpan={8} className="p-5 text-stone-500">{items.length ? 'No matching materials.' : 'No inventory records have been added.'}</td></tr>}</tbody></table></div>}
        </>}
        {editor&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={save} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6"><h3 className="font-bold">{editor.id?'Add stock':'Add Godown item'}</h3>{[['name','Material name'],['unit','Unit'],['category','Category'],['quantity',editor.id?'Quantity received':'Opening stock']].map(([key,label])=><label key={key} className="block text-sm">{label}<input required disabled={saving||(Boolean(editor.id)&&key!=='quantity')} className="mt-1 block w-full rounded-lg border p-2" type={key==='quantity'?'number':'text'} min={key==='quantity'?'0.01':undefined} step={key==='quantity'?'0.01':undefined} value={draft[key]} onChange={e=>{request.current=crypto.randomUUID();setDraft({...draft,[key]:e.target.value});}}/></label>)}{saveError&&<p role="alert" className="text-sm text-red-700">{saveError}</p>}<div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={()=>setEditor(null)}>Cancel</button><button disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-white">{saving?'Saving…':'Save stock'}</button></div></form></div>}
        <CustomerBomDispatchModal isOpen={showBom} onClose={()=>setShowBom(false)} onCreated={()=>{load();setRefreshKey(key=>key+1);}} />
    </section>;
}
