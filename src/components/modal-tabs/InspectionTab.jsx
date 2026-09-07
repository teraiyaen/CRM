import React from "react";
import { Gauge, CheckCircle2, IndianRupee, Edit3, X } from "lucide-react";
import { EditableDetailItem } from "./shared";

export default function InspectionTab({
    editData,
    handleChange,
    editingSection,
    setEditingSection,
    isEditable,
}) {
    const isEditing = editingSection === "inspection_details";

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <section className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <Gauge size={14} className="text-amber-500" /> DISCOM Inspection & Net Metering
                    </h3>
                    {isEditable && (
                        <button 
                            type="button"
                            onClick={() => {
                                const isOpening = editingSection !== "inspection_details";
                                if (setEditingSection) setEditingSection(isOpening ? "inspection_details" : null);
                            }} 
                            className="text-stone-400 hover:text-amber-600 transition-colors p-1 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        >
                            {isEditing ? <><X size={14} /> Close Edit</> : <><Edit3 size={13} /> Edit Details</>}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <EditableDetailItem 
                        label="Meter Charge (₹)" 
                        field="meter_charge" 
                        value={editData.meter_charge} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Inspection / Testing Charge (₹)" 
                        field="charge" 
                        value={editData.charge} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Inspection Status" 
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
                            label="Inspection Remarks" 
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
