import ReferringAgentSelect from './ReferringAgentSelect';
import { useRef, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { supabase } from '../supabase';
import useOperationNames from '../hooks/useOperationNames';
import { operationNames } from '../utils/operationNames';

const fields = [
    ['consumer_name','Name','text'], ['mobile_no','Mobile number','tel'], ['email','Email','email'],
    ['address','Address','text'], ['circle','Circle','text'], ['division','Division','text'],
    ['sub_division','Sub division','text'], ['discom_name','DISCOM','text'],
    ['proposed_capacity_kw','Proposed capacity (kW)','number'], ['panel_brand','Panel brand','module_brand'],
    ['panel_wattage_wp','Panel wattage (Wp)','number'], ['panel_quantity','Panel quantity','number'],
    ['inverter_brand','Inverter brand','inverter_make'], ['inverter_capacity_kw','Inverter capacity (kW)','number'],
    ['dealer','Dealer','channel_partner'], ['ref_agent','Referring agent','text'],
];
export default function AddLeadModal({ isOpen, onClose, onCustomerAdded }) {
    const choices = useOperationNames(isOpen);
    const [form,setForm] = useState({consumer_name:'',dealer:'',discom_name:'Paschim Gujarat Vij Co. Limited'});
    const [saving,setSaving] = useState(false);
    const [error,setError] = useState('');
    const lock = useRef(false);
    async function save(event) {
        event.preventDefault();
        if (lock.current || !form.consumer_name.trim()) return;
        lock.current=true;setSaving(true);setError('');
        try {
            const values = {status:'New',remarks:form.remarks?.trim() || null};
            for (const [key,,type] of fields) {
                const value=String(form[key] ?? '').trim();
                values[key]=value===''?null:type==='number'?Number(value):value;
            }
            const {data,error}=await supabase.from('leads').insert(values).select().single();
            if(error)throw error;
            if(!data)throw new Error('The lead was not saved.');
            onCustomerAdded?.(data);onClose();
        } catch(err) {setError(err.message);} finally {lock.current=false;setSaving(false);}
    }
    if(!isOpen)return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="add-lead-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl crm-surface bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-amber-200 bg-amber-50 p-5"><div><h2 id="add-lead-title" className="flex items-center gap-2 text-lg font-bold"><UserPlus size={20}/>Add Lead</h2><p className="mt-1 text-xs text-stone-600">Save the prospect here. Convert the lead when ready to create a customer project.</p></div><button disabled={saving} aria-label="Close Add Lead" onClick={onClose}><X size={20}/></button></header>
        <form onSubmit={save} className="space-y-4 p-5">
            {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {choices.error&&<p role="alert" className="text-xs text-red-700">Operations names could not be loaded: {choices.error}</p>}
            <fieldset disabled={saving} className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map(([key,label,type])=>key==='ref_agent'?<ReferringAgentSelect key={key} value={form.ref_agent} onChange={value=>setForm({...form,ref_agent:value})} disabled={saving}/>:<label key={key} className="text-xs font-semibold text-stone-700">{label}{key==='consumer_name'?' *':''}
                {['module_brand','inverter_make','channel_partner'].includes(type)?<select className="mt-1 block w-full rounded-lg border p-2 text-sm" value={form[key] || ''} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Select {label.toLowerCase()}</option>{operationNames(choices.rows,type,form[key]).map(name=><option key={name}>{name}</option>)}</select>:<input required={key==='consumer_name'} type={type} min={type==='number'?0:undefined} step={type==='number'?(key==='panel_quantity'?'1':'any'):undefined} className="mt-1 block w-full rounded-lg border p-2 text-sm" value={form[key] ?? ''} onChange={e=>setForm({...form,[key]:e.target.value})}/>}
            </label>)}<label className="text-xs font-semibold text-stone-700 sm:col-span-2">Remarks<textarea className="mt-1 block w-full rounded-lg border p-2 text-sm" value={form.remarks || ''} onChange={e=>setForm({...form,remarks:e.target.value})}/></label></fieldset>
            <footer className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold">{saving?'Saving…':'Save Lead'}</button></footer>
        </form>
    </section></div>;
}
