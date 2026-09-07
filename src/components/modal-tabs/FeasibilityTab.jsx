import React from "react";
import { ClipboardCheck, Zap, CheckCircle2, AlertCircle, Edit3, X } from "lucide-react";
import { EditableDetailItem } from "./shared";

export default function FeasibilityTab({
    editData,
    handleChange,
    editingSection,
    setEditingSection,
    isEditable,
}) {
    const isEditing = editingSection === "feasibility_details";

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <section className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardCheck size={14} className="text-amber-500" /> Technical Feasibility Details
                    </h3>
                    {isEditable && (
                        <button 
                            type="button"
                            onClick={() => {
                                const isOpening = editingSection !== "feasibility_details";
                                if (setEditingSection) setEditingSection(isOpening ? "feasibility_details" : null);
                            }} 
                            className="text-stone-400 hover:text-amber-600 transition-colors p-1 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        >
                            {isEditing ? <><X size={14} /> Close Edit</> : <><Edit3 size={13} /> Edit Details</>}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <EditableDetailItem 
                        label="Proposed Capacity (kWp) *" 
                        field="proposed_capacity_kw" 
                        value={editData.proposed_capacity_kw} 
                        onChange={handleChange} 
                        type="number"
                        isEditing={isEditing} 
                    />
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                        <p className="text-[9px] text-stone-400 uppercase tracking-wide mb-1 font-bold">Capacity Reverification</p>
                        {isEditing ? (
                            <select 
                                value={editData.is_reverified ? "true" : "false"} 
                                onChange={e => handleChange("is_reverified", e.target.value === "true")}
                                className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                            >
                                <option value="true">Reverified (Approved)</option>
                                <option value="false">Pending Reverification</option>
                            </select>
                        ) : (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${editData.is_reverified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                {editData.is_reverified ? "Reverified" : "Pending Reverification"}
                            </span>
                        )}
                    </div>
                    <EditableDetailItem 
                        label="DISCOM Status" 
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
                    <div className="col-span-full">
                        <EditableDetailItem 
                            label="Feasibility Remarks" 
                            field="remarks" 
                            value={editData.remarks} 
                            onChange={handleChange} 
                            isEditing={isEditing} 
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
