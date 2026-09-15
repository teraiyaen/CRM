import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { AgreementPreview } from './agreement/AgreementPreview';
import { stampDetailsFromCustomer, agreementDate } from '../utils/stampDetails';
import SavedDocumentsView from './SavedDocumentsView';
import { agreementSnapshot, saveGeneratedDocument } from '../utils/generatedDocuments';
import { localStampPage } from '../utils/localStampPage';

const fields = [
    ['consumerName','Consumer name'], ['consumerNo','Consumer number'], ['executionDate','Agreement date','date'],
    ['address','Full address'], ['village','Village / city'], ['taluka','Taluka'], ['district','District'], ['state','State'],
    ['vendorName','Vendor / company name'], ['vendorAddress','Vendor registered address'],
];
export default function TemporaryStampView() {
    const [search,setSearch] = useState('');
    const [results,setResults] = useState([]);
    const [error,setError] = useState('');
    const [busy,setBusy] = useState(false);
    const [open,setOpen] = useState(false);
    const [data,setData] = useState(stampDetailsFromCustomer);
    const [preview,setPreview] = useState(false);
    const [stamp,setStamp] = useState(null);
    const [fileBusy,setFileBusy] = useState(false);
    const [fileError,setFileError] = useState('');
    const [fetchNote,setFetchNote] = useState('');
    const [customerId,setCustomerId] = useState(null);
    const [saved,setSaved] = useState(null);
    const [saving,setSaving] = useState(false);
    const [saveError,setSaveError] = useState('');
    const [historyVersion,setHistoryVersion] = useState(0);
    const documentRequest = useRef(null);
    const savingLock = useRef(false);
    async function generate(event){
        event.preventDefault();if(savingLock.current)return;
        if(saved){setPreview(true);return;}
        savingLock.current=true;setSaving(true);setSaveError('');
        try{const record=await saveGeneratedDocument({id:documentRequest.current,kind:'agreement',customerId,snapshot:agreementSnapshot({...data,executionDate:agreementDate(data.executionDate)},Boolean(stamp))});setSaved(record);setHistoryVersion(value=>value+1);setPreview(true);}catch(err){setSaveError(`Agreement values could not be recorded in Activity Log: ${err.message}`);}finally{savingLock.current=false;setSaving(false);}
    }
    const stampUrl = useRef('');
    const fileInput = useRef(null);
    const fileRequest = useRef(0);
    const selectionRequest = useRef(0);
    useEffect(() => () => { fileRequest.current++; selectionRequest.current++; if(stampUrl.current) URL.revokeObjectURL(stampUrl.current); }, []);
    useEffect(() => {
        let cancelled = false;
        if (!search.trim()) {setResults([]);return;}
        const timer = setTimeout(async()=>{
            setError('');
            try {
                const term=search.replace(/[,().%_*\\]/g,' ').trim();
                if (!term) {setResults([]);return;}
                const {data,error}=await supabase.from('admin').select('id,consumer_name,consumer_number,application_number,address').or(`consumer_name.ilike.%${term}%,consumer_number.ilike.%${term}%`).order('consumer_name').limit(20);
                if(error)throw error;
                if(!cancelled)setResults(data||[]);
            } catch(err){if(!cancelled)setError(`Customer search failed: ${err.message}`);}
        },300);
        return()=>{cancelled=true;clearTimeout(timer);};
    },[search]);
    function clearStamp() {
        fileRequest.current++;
        if(stampUrl.current)URL.revokeObjectURL(stampUrl.current);
        stampUrl.current='';setStamp(null);setFileBusy(false);setFileError('');
        if(fileInput.current)fileInput.current.value='';
    }
    async function start(customer) {
        const request=++selectionRequest.current;
        clearStamp();setError('');setBusy(true);setFetchNote('');setCustomerId(customer?.id||null);setSaved(null);setSaveError('');documentRequest.current=crypto.randomUUID();
        let mis={};let note='';
        if(customer?.application_number){
            try{
                const {data,error}=await supabase.from('mis').select('consumer_name,consumer_number,consumer_address,district_name,state_name').eq('application_number',customer.application_number).limit(2);
                if(error)throw error;
                if(data?.length>1)throw new Error('Multiple MIS records match this application.');
                mis=data?.[0]||{};
            }catch(err){note=`MIS details could not be fetched: ${err.message}. Enter the missing values below.`;}
        }
        if(request!==selectionRequest.current)return;
        setData(stampDetailsFromCustomer(customer||{},mis));setFetchNote(note);setOpen(true);setBusy(false);
    }
    async function chooseFile(event) {
        const file=event.target.files?.[0];if(!file)return;
        clearStamp();const request=++fileRequest.current;setFileBusy(true);
        try {
            const {blob,pages}=await localStampPage(file);
            if(request!==fileRequest.current)return;
            const url=URL.createObjectURL(blob);stampUrl.current=url;setStamp({url,name:file.name,pages});
        }catch(err){if(request===fileRequest.current)setFileError(`Stamp could not be read: ${err.message}`);}
        finally{if(request===fileRequest.current)setFileBusy(false);}
    }
    function close() {selectionRequest.current++;clearStamp();setOpen(false);setPreview(false);setData(stampDetailsFromCustomer());}
    return <section className="space-y-4 rounded-2xl border crm-surface bg-white p-6">
        <h2 className="text-lg font-bold">Stamp & Agreement</h2>
        <p className="text-sm text-stone-600">Prepare an agreement with an optional stamp as its first page. Review every value before printing. Completed document values are saved for downloading again. Uploaded stamp files are never stored.</p>
        <label className="block text-sm">Find a customer<input className="mt-1 block w-full rounded-lg border p-3" placeholder="Consumer name or consumer number" value={search} onChange={e=>setSearch(e.target.value)} /></label>
        {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="max-h-60 overflow-y-auto">{results.map(customer=><button disabled={busy} className="block w-full border-b p-3 text-left text-sm hover:bg-amber-50 disabled:opacity-50" key={customer.id} onClick={()=>start(customer)}>{customer.consumer_name} · {customer.consumer_number}</button>)}</div>
        <button disabled={busy} className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={()=>start(null)}>{busy?'Fetching details…':'Enter details manually'}</button>
        {open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form role="dialog" aria-modal="true" aria-labelledby="stamp-details-title" className="flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl crm-surface bg-white" onSubmit={generate}>
            <header className="flex justify-between border-b p-5"><h3 id="stamp-details-title" className="font-bold">Stamp / agreement details</h3><button disabled={saving} type="button" aria-label="Close stamp details" onClick={close}>Close</button></header>
            <div className="space-y-5 overflow-y-auto p-5"><p className="text-sm text-stone-600">Consumer details come from the CRM; district and state come from MIS when available. Village and taluka must be entered separately. These values are saved with this document, without changing the customer record. The vendor signature area uses the temporary stamp.png placeholder.</p>
                {fetchNote&&<p role="status" className="text-sm text-amber-800">{fetchNote}</p>}
                {saveError&&<p role="alert" className="text-sm text-red-700">{saveError}</p>}
                {saved&&<p role="status" className="text-sm text-green-700">Agreement saved. You can download it again below or from Activity Log.</p>}
                <fieldset disabled={saving||Boolean(saved)} className="grid gap-4 sm:grid-cols-2">{fields.map(([key,label,type])=><label className="text-sm" key={key}>{label}<input required type={type||'text'} className="mt-1 block w-full rounded-lg border p-2" value={data[key]} onChange={e=>setData({...data,[key]:e.target.value})}/></label>)}</fieldset>
                <label className="block text-sm font-semibold">Stamp first page (optional)<input ref={fileInput} disabled={saving||Boolean(saved)} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="mt-2 block text-sm" onChange={chooseFile}/></label>
                <p className="text-xs text-stone-500">Skip the upload to generate the four agreement pages. A selected image or the first page of a PDF is prepended to the agreement. Maximum 20 MB.</p>
                {fileBusy&&<p role="status" className="text-sm">Preparing stamp page…</p>}{fileError&&<p role="alert" className="text-sm text-red-700">{fileError}</p>}
                {stamp&&<div><p className="text-sm">{stamp.name}{stamp.pages>1?` · first page of ${stamp.pages} pages`:''}</p><button type="button" disabled={saving||Boolean(saved)} className="my-2 text-sm underline" onClick={clearStamp}>Remove stamp</button><img src={stamp.url} alt="Optional stamp first page" className="max-h-60 max-w-full object-contain"/></div>}
            </div>
            <footer className="flex justify-end gap-3 border-t p-5"><button disabled={saving} type="button" className="rounded-lg border px-4 py-2" onClick={close}>Cancel</button><button disabled={fileBusy||saving} className="rounded-lg bg-stone-900 px-4 py-2 text-white disabled:opacity-50">{saving?'Saving…':saved?'Preview saved agreement':'Create & save agreement'} {stamp?'with stamp':'without stamp'}</button></footer>
        </form></div>}
        <SavedDocumentsView kind="agreement" refreshKey={historyVersion}/>
        {preview&&<AgreementPreview data={{...data,executionDate:agreementDate(data.executionDate),gpaStampUrl:stamp?.url||''}} onChange={next=>setData(previous=>({...previous,showHighlights:next.showHighlights}))} onClose={()=>setPreview(false)}/>}
    </section>;
}
