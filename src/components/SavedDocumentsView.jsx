import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { documentFromActivity, documentHistoryAction } from '../utils/documentHistory';
import TeraiyaBomPrintModal from './TeraiyaBomPrintModal';
import { AgreementPreview } from './agreement/AgreementPreview';
import { PLACEHOLDER_VENDOR_STAMP } from '../agreementCompany';
import { localStampPage } from '../utils/localStampPage';

export function SavedDocumentPreview({ record, onClose }) {
    const [stamp,setStamp] = useState('');
    const mounted = useRef(true);
    useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
    const [error,setError] = useState('');
    const [loading,setLoading] = useState(false);
    const [preview,setPreview] = useState(record.kind === 'bom' || !record.snapshot.hadStamp);
    useEffect(()=>()=>{if(stamp)URL.revokeObjectURL(stamp);},[stamp]);
    if(record.kind==='bom')return <TeraiyaBomPrintModal isOpen onClose={onClose} customer={record.snapshot.customer} customItems={record.snapshot.items} snapshotItems stockIssued={record.snapshot.stockIssued || []} {...record.snapshot.details}/>;
    return <>
        {!preview&&<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"><section className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6"><h3 className="font-bold">Download saved agreement</h3><p className="text-sm">The agreement details are saved. Its optional uploaded stamp was not stored. Select it again to include the first page, or continue without it.</p><input aria-label="Reattach optional stamp" disabled={loading} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setLoading(true);setError('');try{const result=await localStampPage(file);if(!mounted.current)return;setStamp(URL.createObjectURL(result.blob));}catch(err){setError(err.message);}finally{setLoading(false);}}}/>{error&&<p role="alert" className="text-red-700">{error}</p>}<div className="flex gap-3"><button disabled={loading} className="rounded-lg bg-stone-900 px-4 py-2 text-white" onClick={()=>setPreview(true)}>{stamp?'Preview with stamp':'Continue without stamp'}</button><button onClick={onClose}>Cancel</button></div></section></div>}
        {preview&&<AgreementPreview data={{...record.snapshot.data,secondPartyStamp:PLACEHOLDER_VENDOR_STAMP,gpaStampUrl:stamp,showHighlights:false}} onClose={onClose}/>}
    </>;
}
export function SavedDocumentButton({ id }) {
    const [record,setRecord] = useState(null);
    const [error,setError] = useState('');
    const [loading,setLoading] = useState(false);
    return <><button disabled={loading} className="mt-2 rounded-lg border px-3 py-1 text-xs font-bold" onClick={async()=>{setLoading(true);setError('');try{const {data,error}=await supabase.from('activity_log').select('id,action,new_value,created_at').eq('id',id).single();if(error)throw error;const saved=documentFromActivity(data);if(!saved)throw new Error('This activity entry does not contain values for downloading again.');setRecord(saved);}catch(err){setError(err.message);}finally{setLoading(false);}}}>{loading?'Loading…':'View / Download again'}</button>{error&&<p role="alert" className="text-xs text-red-700">{error}</p>}{record&&<SavedDocumentPreview record={record} onClose={()=>setRecord(null)}/>}</>;
}
export default function SavedDocumentsView({ kind = 'bom', refreshKey = 0 }) {
    const [rows,setRows] = useState([]);
    const [error,setError] = useState('');
    const [loading,setLoading] = useState(true);
    const [page,setPage] = useState(0);
    const [more,setMore] = useState(false);
    const load = useCallback(async()=>{
        setLoading(true);setError('');
        try{const {data,error}=await supabase.from('activity_log').select('id,action,new_value,created_at').eq('action',documentHistoryAction(kind)).order('created_at',{ascending:false}).order('id').range(page*50,page*50+49);if(error)throw error;setRows((data||[]).map(documentFromActivity).filter(Boolean));setMore(data?.length===50);}catch(err){setRows([]);setError(err.message);}finally{setLoading(false);}
    },[kind,page]);
    useEffect(()=>{load();},[load,refreshKey]);
    return <section className="space-y-3 rounded-2xl border bg-white p-5"><div className="flex justify-between"><h3 className="font-bold">{kind==='bom'?'BOM history':'DISCOM agreement history'}</h3><button disabled={loading} className="text-sm underline" onClick={load}>Refresh</button></div><p className="text-xs text-stone-500">Generate a fresh PDF from the values in Activity Log. Files are not stored. Downloading again does not change stock.</p>{loading?<p>Loading…</p>:error?<p role="alert" className="text-sm text-red-700">History could not be loaded: {error}</p>:<>{rows.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-3"><div><p className="text-sm font-semibold">{row.customer_name||'Manual entry'}</p><p className="text-xs text-stone-500">{new Date(row.created_at).toLocaleString('en-IN')}</p></div><SavedDocumentButton id={row.id}/></div>)}{!rows.length&&<p className="text-sm text-stone-500">No completed entries yet.</p>}<div className="flex gap-3"><button disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1}</span><button disabled={!more} onClick={()=>setPage(page+1)}>Next</button></div></>}</section>;
}
