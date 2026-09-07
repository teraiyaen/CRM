import React from "react";
import { Send, FileText, IndianRupee, User, Edit3, X, Printer } from "lucide-react";
import { EditableDetailItem } from "./shared";

export default function AgreementTab({
    editData,
    handleChange,
    editingSection,
    setEditingSection,
    isEditable,
    channel_partners = [],
    onGenerateAgreement,
}) {
    const isEditing = editingSection === "agreement_details";

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <section className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <Send size={14} className="text-amber-500" /> Tripartite Agreement & Payment Charges
                    </h3>
                    <div className="flex items-center gap-2">
                        {onGenerateAgreement && (
                            <button
                                type="button"
                                onClick={onGenerateAgreement}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Printer size={13} /> PM Surya Ghar Agreement
                            </button>
                        )}
                        {isEditable && (
                            <button 
                                type="button"
                                onClick={() => {
                                    const isOpening = editingSection !== "agreement_details";
                                    if (setEditingSection) setEditingSection(isOpening ? "agreement_details" : null);
                                }} 
                                className="text-stone-400 hover:text-amber-600 transition-colors p-1 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                            >
                                {isEditing ? <><X size={14} /> Close Edit</> : <><Edit3 size={13} /> Edit Details</>}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <EditableDetailItem 
                        label="Agreement Submit Date" 
                        field="submitted_on" 
                        value={editData.submitted_on} 
                        onChange={handleChange} 
                        type="date"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Stamp Charge (₹)" 
                        field="stamp" 
                        value={editData.stamp} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Processing / Agreement Charge (₹)" 
                        field="charge" 
                        value={editData.charge} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Meter Charge (₹)" 
                        field="meter_charge" 
                        value={editData.meter_charge} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    {/* Status managed in top header & stage actions */}
                </div>
            </section>
        </div>
    );
}
