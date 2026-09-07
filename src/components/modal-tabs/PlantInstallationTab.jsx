import React, { useState, useEffect } from "react";
import { Wrench, Zap, Package, Calendar, Edit3, X, CheckCircle2, ClipboardList, Printer, Layers } from "lucide-react";
import { EditableDetailItem } from "./shared";
import { ROOF_BOM_TEMPLATE, SHED_BOM_TEMPLATE } from "../../constants";
import BomPrintModal from "../BomPrintModal";

export default function PlantInstallationTab({
    editData,
    handleChange,
    editingSection,
    setEditingSection,
    isEditable,
}) {
    const isEditing = editingSection === "installation_details";
    const [bomType, setBomType] = useState(() => 
        String(editData?.roof_shed || '').toUpperCase().includes('SHED') ? 'SHED' : 'ROOF'
    );
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [bomItems, setBomItems] = useState(() => {
        const template = bomType === 'SHED' ? SHED_BOM_TEMPLATE : ROOF_BOM_TEMPLATE;
        try {
            const saved = localStorage.getItem(`solarflow_bom_${editData?.id}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed?.items && Array.isArray(parsed.items)) return parsed.items;
            }
        } catch {}
        return template;
    });

    useEffect(() => {
        const template = bomType === 'SHED' ? SHED_BOM_TEMPLATE : ROOF_BOM_TEMPLATE;
        try {
            const saved = localStorage.getItem(`solarflow_bom_${editData?.id}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed?.items && Array.isArray(parsed.items)) {
                    setBomItems(parsed.items);
                    return;
                }
            }
        } catch {}
        setBomItems(template);
    }, [bomType, editData?.id]);

    const handleQuantityChange = (idx, val) => {
        const updated = [...bomItems];
        updated[idx] = { ...updated[idx], quantity: val };
        setBomItems(updated);
        try {
            if (editData?.id) {
                localStorage.setItem(`solarflow_bom_${editData.id}`, JSON.stringify({
                    bom: { type: bomType, updated_at: new Date().toISOString() },
                    items: updated
                }));
            }
        } catch {}
    };

    const handleAutoCalculate = () => {
        const wp = parseFloat(editData.panel_wattage_wp || 0);
        const qty = parseInt(editData.panel_quantity || 0, 10);
        if (wp > 0 && qty > 0) {
            const kw = ((wp * qty) / 1000).toFixed(2);
            handleChange("proposed_capacity_kw", kw);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Solar Modules Section */}
            <section className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <Package size={14} className="text-amber-500" /> Solar PV Modules / Panels
                    </h3>
                    {isEditable && (
                        <button 
                            type="button"
                            onClick={() => {
                                const isOpening = editingSection !== "installation_details";
                                if (setEditingSection) setEditingSection(isOpening ? "installation_details" : null);
                            }} 
                            className="text-stone-400 hover:text-amber-600 transition-colors p-1 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        >
                            {isEditing ? <><X size={14} /> Close Edit</> : <><Edit3 size={13} /> Edit Details</>}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                    <EditableDetailItem 
                        label="Panel Brand / OEM *" 
                        field="panel_brand" 
                        value={editData.panel_brand} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Panel Wattage (Wp) *" 
                        field="panel_wattage_wp" 
                        value={editData.panel_wattage_wp} 
                        onChange={handleChange} 
                        type="number"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Panel Quantity *" 
                        field="panel_quantity" 
                        value={editData.panel_quantity} 
                        onChange={handleChange} 
                        type="number"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Calculated Capacity (kWp)" 
                        field="proposed_capacity_kw" 
                        value={editData.proposed_capacity_kw} 
                        onChange={handleChange} 
                        type="number"
                        onAutoCalc={isEditing ? handleAutoCalculate : undefined}
                        isEditing={isEditing} 
                    />
                </div>
            </section>

            {/* Inverter & Dispatch Section */}
            <section className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <Wrench size={14} className="text-amber-500" /> Inverter & Plant Logistics
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <EditableDetailItem 
                        label="Inverter Brand / OEM *" 
                        field="inverter_brand" 
                        value={editData.inverter_brand} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Inverter Capacity (kW)" 
                        field="inverter_capacity_kw" 
                        value={editData.inverter_capacity_kw} 
                        onChange={handleChange} 
                        type="number"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Material Dispatch Date" 
                        field="dispatch_date" 
                        value={editData.dispatch_date} 
                        onChange={handleChange} 
                        type="date"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Installation Status" 
                        field="status" 
                        value={editData.status} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Portal Status" 
                        field="portal_status" 
                        value={editData.portal_status} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                </div>
            </section>

            {/* Bill of Materials (BOM) Section */}
            <section className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                        <ClipboardList size={16} className="text-amber-500" />
                        <div>
                            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest">
                                Bill of Materials (BOM) &amp; Dispatch Checklist
                            </h3>
                            <p className="text-[10px] text-stone-400 font-medium">Standard material specification &amp; equipment items ({bomItems.length} items)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Roof vs Shed Toggle */}
                        <div className="inline-flex p-1 bg-stone-100 rounded-xl text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setBomType('ROOF')}
                                className={`px-3 py-1 rounded-lg transition cursor-pointer ${bomType === 'ROOF' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}
                            >
                                Roof Structure
                            </button>
                            <button
                                type="button"
                                onClick={() => setBomType('SHED')}
                                className={`px-3 py-1 rounded-lg transition cursor-pointer ${bomType === 'SHED' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}
                            >
                                Shed Structure
                            </button>
                        </div>

                        {/* Print BOM */}
                        <button
                            type="button"
                            onClick={() => setShowPrintModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                            <Printer size={13} /> Print BOM
                        </button>
                    </div>
                </div>

                {/* BOM Items Table */}
                <div className="border border-stone-150 rounded-2xl overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[9px] tracking-wider sticky top-0 border-b border-stone-150 z-10">
                                <tr>
                                    <th className="py-2 px-3 w-12 text-center">#</th>
                                    <th className="py-2 px-3">Product / Material Name</th>
                                    <th className="py-2 px-3 w-28 text-right">Quantity</th>
                                    <th className="py-2 px-3 w-20 text-center">UOM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {bomItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="py-2 px-3 text-center text-stone-400 font-mono font-bold text-[10px]">
                                            {idx + 1}
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-stone-800">
                                            {item.product_name}
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                            {isEditing && item.quantity_editable !== false ? (
                                                <input
                                                    type="text"
                                                    value={item.quantity || ''}
                                                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                    placeholder="Qty"
                                                    className="w-20 px-2 py-1 text-right bg-white border border-stone-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                                                />
                                            ) : (
                                                <span className="font-bold text-stone-900">
                                                    {item.quantity || '–'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-3 text-center text-stone-500 font-medium text-[10px]">
                                            {item.uom || 'Nos'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Print Modal */}
            {showPrintModal && (
                <BomPrintModal
                    customer={editData}
                    bom={{ type: bomType }}
                    bomItems={bomItems}
                    activeType={bomType}
                    onClose={() => setShowPrintModal(false)}
                />
            )}
        </div>
    );
}
