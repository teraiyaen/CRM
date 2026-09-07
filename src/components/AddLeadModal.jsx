import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Zap, Building2, ShieldCheck, IndianRupee, Save, Plus } from 'lucide-react';
import { supabase } from '../supabase';
import { PORTAL_STATUSES } from '../constants';

export default function AddLeadModal({ isOpen, onClose, onCustomerAdded, currentUser }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        consumer_name: '',
        consumer_number: '',
        mobile_no: '',
        email: '',
        address: '',
        circle: 'RAJKOT RURAL CIRCLE',
        division: 'Rajkot Rural Division',
        sub_division: 'Pardi Sub Division',
        discom_name: 'Paschim Gujarat Vij Co. Limited',
        proposed_capacity_kw: '3.24',
        panel_brand: 'Waaree Energies Limited',
        panel_wattage_wp: '540',
        panel_quantity: '6',
        inverter_brand: 'POLYCAB',
        inverter_capacity_kw: '3.6',
        dealer: 'Teraiya',
        ref_agent: '',
        payment_mode_raw: 'LOAN',
        actual_payment: '',
        meter_charge: '2950',
        charge: '800',
        portal_status: 'Upload Agreement (Pending)',
        status: 'Upload Agreement (Pending)',
        is_interested: true,
        is_reverified: false,
        remarks: ''
    });

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value,
            ...(field === 'portal_status' ? { status: value } : {})
        }));
    };

    const handleCapacityChange = (kw) => {
        const capacity = parseFloat(kw) || 0;
        let panels = 6;
        let watts = 540;
        if (capacity > 4) {
            panels = 8;
        } else if (capacity > 3.5) {
            panels = 7;
        }
        setForm(prev => ({
            ...prev,
            proposed_capacity_kw: kw,
            panel_quantity: panels.toString(),
            panel_wattage_wp: watts.toString()
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        if (!form.consumer_name.trim()) {
            setError('Consumer Name is required.');
            setSaving(false);
            return;
        }

        if (!form.consumer_number.trim()) {
            setError('Consumer Number is required.');
            setSaving(false);
            return;
        }

        try {
            const cleanConsumerNo = form.consumer_number.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

            const insertData = {
                consumer_name: form.consumer_name.trim(),
                consumer_number: cleanConsumerNo,
                mobile_no: form.mobile_no.trim() || null,
                email: form.email.trim() || null,
                address: form.address.trim() || null,
                circle: form.circle || null,
                division: form.division || null,
                sub_division: form.sub_division || null,
                discom_name: form.discom_name || null,
                proposed_capacity_kw: parseFloat(form.proposed_capacity_kw) || null,
                panel_brand: form.panel_brand || null,
                panel_wattage_wp: parseFloat(form.panel_wattage_wp) || null,
                panel_quantity: parseInt(form.panel_quantity) || null,
                inverter_brand: form.inverter_brand || null,
                inverter_capacity_kw: parseFloat(form.inverter_capacity_kw) || null,
                dealer: form.dealer.trim() || 'Teraiya',
                ref_agent: form.ref_agent.trim() || null,
                payment_mode_raw: form.payment_mode_raw || null,
                actual_payment: parseFloat(form.actual_payment) || null,
                meter_charge: parseFloat(form.meter_charge) || null,
                charge: parseFloat(form.charge) || null,
                portal_status: form.portal_status,
                status: form.portal_status,
                is_interested: form.is_interested,
                is_reverified: form.is_reverified,
                remarks: form.remarks.trim() || null,
                sources: 'MANUAL_ENTRY'
            };

            const { data, error: insertError } = await supabase
                .from('admin')
                .insert([insertData])
                .select()
                .single();

            if (insertError) throw insertError;

            if (onCustomerAdded) {
                onCustomerAdded(data);
            }
            onClose();
        } catch (err) {
            console.error('Failed to add lead:', err);
            setError(err.message || 'Failed to save customer lead.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-900">Add New Solar Project Lead</h2>
                            <p className="text-xs text-stone-500">Create a consumer application record in PM Surya Ghar workflow</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/50 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Customer Info Section */}
                    <div>
                        <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <User className="w-4 h-4" /> Consumer & Location Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Consumer Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. KARIYA KALPESH GIRISHBHAI"
                                    value={form.consumer_name}
                                    onChange={(e) => handleChange('consumer_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Consumer Number (PGVCL/Discom) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 30702188131"
                                    value={form.consumer_number}
                                    onChange={(e) => handleChange('consumer_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 7046553913"
                                    value={form.mobile_no}
                                    onChange={(e) => handleChange('mobile_no', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="e.g. consumer@example.com"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Installation Address</label>
                                <input
                                    type="text"
                                    placeholder="Full address or village"
                                    value={form.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Discom Name</label>
                                <select
                                    value={form.discom_name}
                                    onChange={(e) => handleChange('discom_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                >
                                    <option value="Paschim Gujarat Vij Co. Limited">Paschim Gujarat Vij Co. Limited (PGVCL)</option>
                                    <option value="Uttar Gujarat Vij Company Limited">Uttar Gujarat Vij Company Limited (UGVCL)</option>
                                    <option value="Madhya Gujarat VIJ Company Ltd.">Madhya Gujarat VIJ Company Ltd. (MGVCL)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Sub Division</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Madhapar Urban Sub Division"
                                    value={form.sub_division}
                                    onChange={(e) => handleChange('sub_division', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Technical Specs */}
                    <div className="pt-4 border-t border-stone-200">
                        <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Zap className="w-4 h-4" /> Technical Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Proposed Capacity (kWp)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.proposed_capacity_kw}
                                    onChange={(e) => handleCapacityChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-amber-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Panel Brand OEM</label>
                                <select
                                    value={form.panel_brand}
                                    onChange={(e) => handleChange('panel_brand', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                >
                                    <option value="Waaree Energies Limited">Waaree Energies Limited</option>
                                    <option value="Mundra Solar Energy Limited">Mundra Solar Energy Limited (Adani)</option>
                                    <option value="Renewsys">Renewsys Solar</option>
                                    <option value="Tata Power Renewable Energy Limited">Tata Power Solar</option>
                                    <option value="Goldi Solar">Goldi Solar</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">No. of Modules & Wattage</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={form.panel_quantity}
                                        onChange={(e) => handleChange('panel_quantity', e.target.value)}
                                        className="px-2 py-2 border border-stone-300 rounded-lg text-sm text-center font-bold"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Watt"
                                        value={form.panel_wattage_wp}
                                        onChange={(e) => handleChange('panel_wattage_wp', e.target.value)}
                                        className="px-2 py-2 border border-stone-300 rounded-lg text-sm text-center"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Inverter Brand OEM</label>
                                <select
                                    value={form.inverter_brand}
                                    onChange={(e) => handleChange('inverter_brand', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                >
                                    <option value="POLYCAB">POLYCAB</option>
                                    <option value="SOLARYAAN">SOLARYAAN</option>
                                    <option value="GROWATT">GROWATT</option>
                                    <option value="HAVELLS">HAVELLS</option>
                                    <option value="SOLAX">SOLAX</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Inverter Capacity (kW)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={form.inverter_capacity_kw}
                                    onChange={(e) => handleChange('inverter_capacity_kw', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Initial Portal Stage</label>
                                <select
                                    value={form.portal_status}
                                    onChange={(e) => handleChange('portal_status', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-medium text-stone-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                >
                                    {PORTAL_STATUSES.map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Dealer & Commercials */}
                    <div className="pt-4 border-t border-stone-200">
                        <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" /> Dealer & Commercial Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Dealer</label>
                                <input
                                    type="text"
                                    value={form.dealer}
                                    onChange={(e) => handleChange('dealer', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-stone-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Reference / Agent (REF)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. YASH / PARESH / SHYAMBHAI"
                                    value={form.ref_agent}
                                    onChange={(e) => handleChange('ref_agent', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Mode</label>
                                <select
                                    value={form.payment_mode_raw}
                                    onChange={(e) => handleChange('payment_mode_raw', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                >
                                    <option value="LOAN">Bank Loan (JanSamarth / Solfin)</option>
                                    <option value="CASH">Direct Cash</option>
                                    <option value="BANK TRANSFER">Bank Online Transfer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Actual Payment Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 189000"
                                    value={form.actual_payment}
                                    onChange={(e) => handleChange('actual_payment', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Meter Charge (₹)</label>
                                <input
                                    type="number"
                                    value={form.meter_charge}
                                    onChange={(e) => handleChange('meter_charge', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Notes / Remarks</label>
                                <input
                                    type="text"
                                    placeholder="Optional notes"
                                    value={form.remarks}
                                    onChange={(e) => handleChange('remarks', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-stone-600 hover:text-stone-800 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Creating Lead...' : 'Create Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
