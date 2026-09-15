import { useEffect, useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { supabase } from '../supabase';
import { saveGeneratedDocument } from '../utils/generatedDocuments';
import { bomStockMovements } from '../utils/bomStock';
import TeraiyaBomPrintModal from './TeraiyaBomPrintModal';
import { TERAIYA_BOM_HEADINGS, createTeraiyaBomItems, isFixedBomCell, autofillBomQuantities } from '../teraiyaBomTemplate';

const emptyDetails = () => ({ vehicleNo: '', driverName: '', driverContact: '', dealerName: '', dispatchedBy: '', approvedBy: '', portalCharge: '', meterFee: '', materialCondition: '', customerSign: '' });
const detailLabels = {
    vehicleNo: 'Vehicle number', driverName: 'Driver name', driverContact: 'Driver contact',
    dealerName: 'Dealer name', dispatchedBy: 'Dispatched by', approvedBy: 'Approved by',
    portalCharge: 'Portal charge', meterFee: 'Meter fee', materialCondition: 'Material condition / damage check', customerSign: 'Customer sign-off',
};
const inputClass = 'w-full min-w-20 rounded-lg border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400';

export default function CustomerBomDispatchModal({ isOpen, onClose, initialCustomer = null, onCreated }) {
    const [customer, setCustomer] = useState(null);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [items, setItems] = useState(createTeraiyaBomItems);
    const [details, setDetails] = useState(emptyDetails);
    const [showPrint, setShowPrint] = useState(false);
    const [inventory,setInventory] = useState([]);
    const [stockError,setStockError] = useState('');
    const [stockLoading,setStockLoading] = useState(false);
    const [saving,setSaving] = useState(false);
    const [saved,setSaved] = useState(null);
    const requestId = useRef(null);
    const saveLock = useRef(false);
    const [autofillNotice, setAutofillNotice] = useState('');
    function autofillQuantities() {
        setItems(previous => autofillBomQuantities(previous));
        setAutofillNotice('All three quantity columns filled for the 34 materials. Existing entries were kept. Review these reference quantities for this project before creating the BOM.');
    }
    useEffect(()=>{
        if(!isOpen)return;let cancelled=false;setStockLoading(true);setStockError('');
        (async()=>{try{const rows=[];for(let start=0;;start+=500){const {data,error}=await supabase.from('godown_inventory').select('id,material_description,unit,in_stock,is_sample,sample_key').or('is_sample.is.null,is_sample.eq.false').order('id').range(start,start+499);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<500)break;}if(!cancelled)setInventory(rows);}catch(err){if(!cancelled)setStockError(err.message);}finally{if(!cancelled)setStockLoading(false);}})();
        return()=>{cancelled=true;};
    },[isOpen]);
    async function createBom(){
        if(saveLock.current||saved)return;
        if (!customer) { setError('Select a customer first.'); return; }
        if (stockLoading || stockError) { setError(stockError || 'Wait for Godown stock to load.'); return; }
        let movements;
        try { movements = bomStockMovements(items, inventory); }
        catch (err) { setError(err.message); return; }
        saveLock.current=true;setSaving(true);setError('');
        try{const record=await saveGeneratedDocument({id:requestId.current,kind:'bom',customerId:customer.id,snapshot:{version:1,customer:{consumer_name:customer.consumer_name,consumer_number:customer.consumer_number,proposed_capacity_kw:customer.proposed_capacity_kw},items,details},movements:movements.map(row=>({...row,quantity:Number(row.quantity)}))});setSaved(record);setShowPrint(true);onCreated?.();}
        catch(err){setError(`BOM was not confirmed: ${err.message}. If setup is missing, run setup_godown_documents.sql.`);}
        finally{saveLock.current=false;setSaving(false);}
    }

    useEffect(() => {
        if (!isOpen) return;
        setCustomer(initialCustomer);
        setItems(createTeraiyaBomItems());
        setDetails(emptyDetails());
        setSearch('');
        setResults([]);
        setError('');
        setAutofillNotice('');
        setShowPrint(false);setSaved(null);requestId.current=crypto.randomUUID();
    }, [isOpen, initialCustomer]);

    useEffect(() => {
        if (!isOpen || customer || !search.trim()) { setResults([]); return; }
        let cancelled = false;
        const timer = setTimeout(async () => {
            setSearching(true);
            setError('');
            try {
                const term = search.replace(/[,().%_*\\]/g, ' ').trim();
                if (!term) return;
                const { data, error: queryError } = await supabase.from('admin')
                    .select('id, consumer_name, consumer_number, mobile_no, proposed_capacity_kw')
                    .or(`consumer_name.ilike.%${term}%,consumer_number.ilike.%${term}%,mobile_no.ilike.%${term}%`)
                    .order('consumer_name').limit(20);
                if (queryError) throw queryError;
                if (!cancelled) setResults(data || []);
            } catch (err) {
                if (!cancelled) { setError(`Customers could not be loaded: ${err.message}`); setResults([]); }
            } finally { if (!cancelled) setSearching(false); }
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [isOpen, customer, search]);

    function changeCell(sr, key, value) {
        if (isFixedBomCell(sr, key)) return;
        setItems(previous => previous.map(item => item.sr === sr ? { ...item, [key]: value } : item));
    }

    function cell(item, key) {
        if (isFixedBomCell(item.sr, key)) return <span className="block px-2 py-1 font-semibold">{item[key]}</span>;
        const label = key.startsWith('col') ? TERAIYA_BOM_HEADINGS[Number(key.slice(3)) - 1] : key;
        return <input aria-label={`Row ${item.sr} ${label}`} className={inputClass} value={item[key] || ''} onChange={event => changeCell(item.sr, key, event.target.value)} />;
    }

    if (!isOpen) return null;
    return <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-3">
            <section role="dialog" aria-modal="true" aria-labelledby="material-list-title" className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <header className="flex items-center justify-between bg-stone-900 px-5 py-4 text-white">
                    <div><h2 id="material-list-title" className="font-bold">Solar material list</h2><p className="mt-1 text-xs text-stone-300">TERAIYA ENTERPRISE</p></div>
                    <button disabled={saving} aria-label="Close material list" onClick={onClose}><X size={20} /></button>
                </header>
                <div className="overflow-y-auto p-5"><fieldset disabled={saving||Boolean(saved)} className="space-y-5">
                    <p className="text-sm text-stone-600">Review and edit the quantities under each name. Material names and units follow the supplied list.</p>
                    <div className="space-y-2"><button type="button" className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold disabled:opacity-50" onClick={autofillQuantities}>Autofill quantities</button><p className="text-xs text-stone-500">Fills blank cells in all three columns from the material’s reference quantities; uses 0 when no quantity is supplied. Review for the project capacity before dispatch.</p></div>
                    {autofillNotice && <p role="status" className="text-sm text-amber-800">{autofillNotice}</p>}
                    <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Create BOM adds the three quantity columns for each material and deducts that total from Godown once, using the unit shown. Previewing or downloading again does not deduct stock.</p>
                    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
                    {saved&&<p role="status" className="text-sm text-green-700">BOM saved and stock dispatched. Download it again from Godown or Activity Log.</p>}
                    {customer ? <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                        <div><strong>{customer.consumer_name || customer.customer_name}</strong><p className="text-xs text-stone-500">{customer.consumer_number} {customer.proposed_capacity_kw ? `· ${customer.proposed_capacity_kw} kW` : ''}</p></div>
                        {!initialCustomer && <button className="text-xs underline" onClick={() => { setCustomer(null); setItems(createTeraiyaBomItems()); setDetails(emptyDetails()); setSearch(''); }}>Change customer</button>}
                    </div> : <div>
                        <label className="text-xs font-bold" htmlFor="bom-customer-search">Customer</label>
                        <input id="bom-customer-search" className={inputClass} placeholder="Search name, consumer number or mobile" value={search} onChange={event => setSearch(event.target.value)} />
                        {searching && <p className="text-xs">Searching…</p>}
                        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                        <div className="max-h-40 overflow-y-auto">{results.map(result => <button key={result.id} className="block w-full border-b p-2 text-left text-sm hover:bg-amber-50" onClick={() => { setCustomer(result); setResults([]); }}>{result.consumer_name} · {result.consumer_number}</button>)}</div>
                    </div>}
                    <div className="overflow-x-auto rounded-xl border border-stone-200">
                        <table className="w-full min-w-[900px] text-xs">
                            <thead className="bg-stone-100"><tr><th className="p-2">SR</th><th className="p-2 text-left">Material description</th>{TERAIYA_BOM_HEADINGS.map(name => <th className="w-32 p-2" key={name}>{name}</th>)}<th className="w-24 p-2">Unit</th><th className="w-36 p-2">Remark</th></tr></thead>
                            <tbody>{items.map(item => <tr className="border-t border-stone-200" key={item.sr}>
                                <td className="p-2 text-center">{item.sr <= 34 ? item.sr : ''}</td>
                                <td className="min-w-64 p-1">{cell(item, 'name')}{/MAKE:|ML:|SIZE:/.test(item.name) && <input aria-label={`Row ${item.sr} make, size or volume`} placeholder={item.name.includes('MAKE:') ? 'Enter make' : item.name.includes('ML:') ? 'Enter volume (ml)' : 'Enter size'} className={inputClass} value={item.detail} onChange={event => changeCell(item.sr, 'detail', event.target.value)} />}</td>
                                <td className="p-1">{cell(item, 'col1')}</td>
                                <td className="p-1" colSpan={item.mergeLastColumns ? 2 : 1}>{cell(item, 'col2')}</td>
                                {!item.mergeLastColumns && <td className="p-1">{cell(item, 'col3')}</td>}
                                <td className="p-1">{cell(item, 'unit')}</td><td className="p-1">{cell(item, 'remark')}</td>
                            </tr>)}</tbody>
                        </table>
                    </div>
                    {stockLoading && <p className="text-xs text-stone-500">Loading Godown stock…</p>}
                    {stockError && <p role="alert" className="text-sm text-red-700">Godown stock could not be loaded: {stockError}</p>}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(detailLabels).map(([key, label]) => <label key={key} className="space-y-1 text-xs font-semibold"><span>{label}</span><input className={inputClass} value={details[key]} onChange={event => setDetails(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}</div>
                </fieldset></div>
                <footer className="flex justify-end gap-3 border-t bg-stone-50 p-4">
                    <button disabled={saving} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Close</button>
                    {!saved&&<button disabled={saving||stockLoading||Boolean(stockError)||!customer} onClick={createBom} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold disabled:opacity-50">{saving?'Creating…':'Create BOM & dispatch stock'}</button>}
                    <button disabled={!customer||saving} onClick={() => setShowPrint(true)} className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-40"><Printer size={16} /> Preview / Print PDF</button>
                </footer>
            </section>
        </div>
        <TeraiyaBomPrintModal isOpen={showPrint} onClose={() => setShowPrint(false)} customer={saved?.snapshot.customer || customer || {}} customItems={saved?.snapshot.items || items} snapshotItems={Boolean(saved)} stockIssued={saved?.snapshot.stockIssued || []} {...(saved?.snapshot.details || details)} />
    </>;
}
