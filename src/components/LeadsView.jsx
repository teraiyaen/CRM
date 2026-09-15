import ReferringAgentSelect from './ReferringAgentSelect';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, Search, Filter, RefreshCw, CheckCircle2, XCircle, Clock, ArrowRight, Phone, Mail, MapPin, Zap, UserPlus } from 'lucide-react';
import { supabase } from '../supabase';
import useOperationNames from '../hooks/useOperationNames';
import { operationNames } from '../utils/operationNames';

export default function LeadsView({ currentUser, onLeadConverted }) {
    const [leads, setLeads] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const actionLock = useRef(false);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'NEW' | 'CONVERTED' | 'LOST'
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const dealerChoices = useOperationNames(showAddModal);
    const [selectedLeadForLost, setSelectedLeadForLost] = useState(null);
    const [lostReason, setLostReason] = useState('');

    // Add Lead Form State
    const [form, setForm] = useState({
        consumer_name: '',
        mobile_no: '',
        email: '',
        address: '',
        sub_division: '',
        division: '',
        circle: '',
        discom_name: 'Paschim Gujarat Vij Co. Limited',
        proposed_capacity_kw: '3.24',
        dealer: '',
        ref_agent: '',
        remarks: ''
    });

    const fetchLeads = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const rows = [];
            for (let start = 0; ; start += 500) {
                const { data, error } = await supabase.from('leads').select('*').order('created_at', {ascending:false}).order('id').range(start,start+499);
                if (error) throw error;
                rows.push(...(data || []));
                if (!data || data.length < 500) break;
            }
            setLeads(rows);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleAddLead = async (e) => {
        e.preventDefault();
        if (!form.consumer_name.trim() || actionLock.current) return;
        actionLock.current = true; setBusy(true); setError('');

        const newLead = {
            consumer_name: form.consumer_name.trim(),
            mobile_no: form.mobile_no.trim() || null,
            email: form.email.trim() || null,
            address: form.address.trim() || null,
            sub_division: form.sub_division.trim() || null,
            division: form.division.trim() || null,
            circle: form.circle.trim() || null,
            discom_name: form.discom_name || 'Paschim Gujarat Vij Co. Limited',
            proposed_capacity_kw: parseFloat(form.proposed_capacity_kw) || 3.24,
            dealer: form.dealer || null,
            ref_agent: form.ref_agent || null,
            status: 'New',
            remarks: form.remarks || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
            if (error) throw error;
            if (!data) throw new Error('Lead was not saved.');
            setLeads(previous => [data, ...previous]);
        } catch (err) { setError(err.message); return; }
        finally { actionLock.current = false; setBusy(false); }

        setShowAddModal(false);
        setForm({
            consumer_name: '',
                mobile_no: '',
            email: '',
            address: '',
            sub_division: '',
            division: '',
            circle: '',
            discom_name: 'Paschim Gujarat Vij Co. Limited',
            proposed_capacity_kw: '3.24',
            dealer: '',
            ref_agent: '',
            remarks: ''
        });
    };

    const handleConvertLead = async (lead) => {
        if (actionLock.current) return;
        actionLock.current = true; setBusy(true); setError('');
        try {
            const { data, error } = await supabase.rpc('crm_convert_lead', { p_lead_id: lead.id });
            if (error) throw error;
            if (!data?.lead?.id || !data?.customer?.id) throw new Error('Conversion was not confirmed.');
            setLeads(previous => previous.map(row => row.id === lead.id ? data.lead : row));
            setActiveFilter('CONVERTED');
            onLeadConverted?.(data.customer);
        } catch (err) { setError(`Lead conversion failed: ${err.message}`); }
        finally { actionLock.current = false; setBusy(false); }
    };

    const handleMarkLost = async () => {
        if (!selectedLeadForLost || actionLock.current) return;
        actionLock.current = true; setBusy(true); setError('');
        try {
            const {data,error} = await supabase.from('leads').update({status:'Lost', lost_reason:lostReason || 'Client not interested',updated_at:new Date().toISOString()}).eq('id',selectedLeadForLost.id).select().single();
            if (error) throw error;
            if (!data) throw new Error('Lead status was not saved.');
            setLeads(previous => previous.map(row => row.id === data.id ? data : row));
            setSelectedLeadForLost(null); setLostReason('');
        } catch (err) { setError(err.message); }
        finally { actionLock.current = false; setBusy(false); }
    };

    // Filter calculations
    const totalCount = leads.length;
    const newCount = leads.filter(l => (l.status || 'New').toLowerCase() === 'new' || (l.status || '').toLowerCase() === 'contacted').length;
    const convertedCount = leads.filter(l => (l.status || '').toLowerCase() === 'converted').length;
    const lostCount = leads.filter(l => (l.status || '').toLowerCase() === 'lost').length;

    const filtered = leads.filter(lead => {
        const s = (lead.status || 'New').toUpperCase();
        let matchesFilter = true;
        if (activeFilter === 'NEW') matchesFilter = (s === 'NEW' || s === 'CONTACTED');
        else if (activeFilter === 'CONVERTED') matchesFilter = (s === 'CONVERTED');
        else if (activeFilter === 'LOST') matchesFilter = (s === 'LOST');

        const q = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            (lead.consumer_name || '').toLowerCase().includes(q) ||
            (lead.mobile_no || '').includes(q) ||
            (lead.consumer_number || '').toLowerCase().includes(q) ||
            (lead.address || '').toLowerCase().includes(q);

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                        activeFilter === 'ALL'
                            ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                            : 'crm-surface bg-white border-stone-200/80 text-stone-800 hover:border-stone-300'
                    }`}
                >
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-60">All Leads</p>
                    <p className="text-2xl font-black">{totalCount}</p>
                </button>

                <button
                    onClick={() => setActiveFilter('NEW')}
                    className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                        activeFilter === 'NEW'
                            ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                            : 'crm-surface bg-white border-amber-200/80 text-amber-900 hover:border-amber-300'
                    }`}
                >
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-80">New / Open</p>
                    <p className="text-2xl font-black">{newCount}</p>
                </button>

                <button
                    onClick={() => setActiveFilter('CONVERTED')}
                    className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                        activeFilter === 'CONVERTED'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                            : 'crm-surface bg-white border-emerald-200/80 text-emerald-900 hover:border-emerald-300'
                    }`}
                >
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-80">Converted</p>
                    <p className="text-2xl font-black">{convertedCount}</p>
                </button>

                <button
                    onClick={() => setActiveFilter('LOST')}
                    className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                        activeFilter === 'LOST'
                            ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                            : 'crm-surface bg-white border-rose-200/80 text-rose-900 hover:border-rose-300'
                    }`}
                >
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-80">Lost</p>
                    <p className="text-2xl font-black">{lostCount}</p>
                </button>
            </div>

            {/* Controls Bar */}
            <div className="crm-surface bg-white p-4 rounded-2xl border border-stone-150 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search lead by name, phone, consumer number, village..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchLeads}
                        className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-stone-600 transition-colors cursor-pointer"
                        title="Refresh Leads"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-amber-500" : ""} />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus size={14} /> Add Lead
                    </button>
                </div>
            </div>

            {/* Leads Table */}
            <div className="crm-surface bg-white rounded-2xl border border-stone-150 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-stone-100 bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                <th className="py-3 px-4">Lead Name</th>
                                <th className="py-3 px-4">Contact</th>
                                <th className="py-3 px-4">Location / Division</th>
                                <th className="py-3 px-4">Capacity</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Remarks</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-stone-400 font-medium">
                                        No leads found under this filter. Click "+ Add Lead" to register a new prospect.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(lead => {
                                    const st = (lead.status || 'New').toUpperCase();
                                    const badgeClass =
                                        st === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        st === 'LOST' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        'bg-amber-50 text-amber-700 border-amber-200';

                                    return (
                                        <tr key={lead.id} className="hover:bg-stone-50/60 transition-colors">
                                            <td className="py-3 px-4 font-bold text-stone-900">
                                                <div>{lead.consumer_name}</div>
                                                {lead.consumer_number && (
                                                    <span className="text-[10px] font-mono text-stone-400">#{lead.consumer_number}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-stone-700">{lead.mobile_no || '–'}</div>
                                                {lead.email && <div className="text-[10px] text-stone-400 truncate max-w-[150px]">{lead.email}</div>}
                                            </td>
                                            <td className="py-3 px-4 text-stone-600">
                                                <div>{lead.sub_division || lead.address || '–'}</div>
                                                {lead.circle && <div className="text-[10px] text-stone-400">{lead.circle}</div>}
                                            </td>
                                            <td className="py-3 px-4 font-bold text-stone-800">
                                                {lead.proposed_capacity_kw ? `${lead.proposed_capacity_kw} kW` : '–'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                                                    {lead.status || 'New'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                                                {lead.lost_reason ? (
                                                    <span className="text-rose-600 font-semibold">Lost: {lead.lost_reason}</span>
                                                ) : (
                                                    lead.remarks || '–'
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                                                {st !== 'CONVERTED' && st !== 'LOST' && (
                                                    <>
                                                        <button
                                                            disabled={busy} onClick={() => handleConvertLead(lead)}
                                                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                                                        >
                                                            Convert
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedLeadForLost(lead)}
                                                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                                                        >
                                                            Lost
                                                        </button>
                                                    </>
                                                )}
                                                {st === 'CONVERTED' && (
                                                    <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                                                        <CheckCircle2 size={12} /> Converted
                                                    </span>
                                                )}
                                                {st === 'LOST' && (
                                                    <span className="text-[11px] font-bold text-rose-500 flex items-center justify-end gap-1">
                                                        <XCircle size={12} /> Closed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="crm-surface bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-stone-150 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                                <UserPlus size={16} className="text-amber-500" /> Add New Lead
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600">
                                ✕
                            </button>
                        </div>

                        <form aria-busy={busy} onSubmit={handleAddLead} className="space-y-3">
                            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.consumer_name}
                                        onChange={e => setForm(p => ({ ...p, consumer_name: e.target.value }))}
                                        placeholder="Full name"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Phone / Mobile</label>
                                    <input
                                        type="tel"
                                        value={form.mobile_no}
                                        onChange={e => setForm(p => ({ ...p, mobile_no: e.target.value }))}
                                        placeholder="10-digit mobile"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">

                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Capacity (kW)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.proposed_capacity_kw}
                                        onChange={e => setForm(p => ({ ...p, proposed_capacity_kw: e.target.value }))}
                                        placeholder="3.24"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                </div>
                            </div>

                            <ReferringAgentSelect value={form.ref_agent} onChange={value=>setForm(previous=>({...previous,ref_agent:value}))} disabled={busy}/>
                            <div>
                                <label htmlFor="new-lead-dealer" className="block text-xs font-bold text-stone-700 mb-1">Dealer name</label>
                                <select id="new-lead-dealer" disabled={busy || dealerChoices.loading || Boolean(dealerChoices.error)} value={form.dealer} onChange={e=>setForm(previous=>({...previous,dealer:e.target.value}))} className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
                                    <option value="">{dealerChoices.loading?'Loading dealers…':'Select dealer'}</option>
                                    {operationNames(dealerChoices.rows,'channel_partner').map(name=><option key={name} value={name}>{name}</option>)}
                                </select>
                                {dealerChoices.error && <p role="alert" className="mt-1 text-xs text-red-700">Dealers could not be loaded: {dealerChoices.error}</p>}
                                <div className="mt-1 flex items-center justify-between gap-2"><p className="text-xs text-stone-500">Manage dealer names in Operations.</p><button type="button" disabled={busy || dealerChoices.loading} onClick={dealerChoices.refresh} className="text-xs font-semibold text-sky-700 underline">Refresh dealers</button></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Village / Address</label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                        placeholder="Village or Town"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Sub Division</label>
                                    <input
                                        type="text"
                                        value={form.sub_division}
                                        onChange={e => setForm(p => ({ ...p, sub_division: e.target.value }))}
                                        placeholder="e.g. Pardi"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">Notes / Remarks</label>
                                <textarea
                                    rows={2}
                                    value={form.remarks}
                                    onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                                    placeholder="Initial discussion notes..."
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={busy} type="submit"
                                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-sm"
                                >
                                    Save Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mark as Lost Modal */}
            {selectedLeadForLost && (
                <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="crm-surface bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-stone-150 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                            <h3 className="text-sm font-bold text-rose-700">Mark Lead as Lost</h3>
                            <button onClick={() => setSelectedLeadForLost(null)} className="text-stone-400 hover:text-stone-600">✕</button>
                        </div>
                        <p className="text-xs text-stone-600">
                            Provide the reason why <strong>{selectedLeadForLost.consumer_name}</strong> was marked as lost.
                        </p>
                        <textarea
                            rows={3}
                            value={lostReason}
                            onChange={e => setLostReason(e.target.value)}
                            placeholder="Reason (e.g. Roof unsuitable, Loan rejected, Chose competitor)..."
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedLeadForLost(null)}
                                className="px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={busy} onClick={handleMarkLost}
                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
                            >
                                {busy ? 'Saving…' : 'Confirm Lost'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
