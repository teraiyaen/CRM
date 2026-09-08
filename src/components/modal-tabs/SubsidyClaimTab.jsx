import React from "react";
import { Tag, IndianRupee, Banknote, Calendar, Edit3, X, CheckCircle2 } from "lucide-react";
import { EditableDetailItem } from "./shared";

export default function SubsidyClaimTab({
    editData,
    handleChange,
    editingSection,
    setEditingSection,
    isEditable,
}) {
    const isEditing = editingSection === "subsidy_claim_details";

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Financing & Payment Breakdown */}
            <section className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <Tag size={14} className="text-amber-500" /> Subsidy Claim & Financing Details
                    </h3>
                    {isEditable && (
                        <button 
                            type="button"
                            onClick={() => {
                                const isOpening = editingSection !== "subsidy_claim_details";
                                if (setEditingSection) setEditingSection(isOpening ? "subsidy_claim_details" : null);
                            }} 
                            className="text-stone-400 hover:text-amber-600 transition-colors p-1 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        >
                            {isEditing ? <><X size={14} /> Close Edit</> : <><Edit3 size={13} /> Edit Details</>}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <EditableDetailItem 
                        label="* (Financing Tag)" 
                        field="financing_tag" 
                        value={editData.financing_tag} 
                        onChange={handleChange} 
                        type="text"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Agreed Project Cost (₹)" 
                        field="payment" 
                        value={editData.payment} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Actual Payment Received (₹)" 
                        field="actual_payment" 
                        value={editData.actual_payment} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Payment Mode / Details" 
                        field="payment_mode_raw" 
                        value={editData.payment_mode_raw} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Loan Status" 
                        field="loan_status" 
                        value={editData.loan_status} 
                        onChange={handleChange} 
                        options={["Inprocess", "Sanctioned", "1st Payment", "2nd Payment", "Total Received", "Reject"]}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Loan Disbursed Amount (₹)" 
                        field="loan_disbursed_amount" 
                        value={editData.loan_disbursed_amount} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="1st Tranche Date" 
                        field="first_tranche_date" 
                        value={editData.first_tranche_date} 
                        onChange={handleChange} 
                        type="date" 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="2nd Tranche Date" 
                        field="second_tranche_date" 
                        value={editData.second_tranche_date} 
                        onChange={handleChange} 
                        type="date" 
                        isEditing={isEditing} 
                    />
                </div>
            </section>

            {/* PM Surya Ghar DBT Subsidy Section */}
            <section className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" /> PM Surya Ghar DBT Subsidy
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <EditableDetailItem 
                        label="Eligible Subsidy Amount (₹)" 
                        field="subsidy_amount" 
                        value={editData.subsidy_amount} 
                        onChange={handleChange} 
                        isMoney={true}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Subsidy Disbursed Date" 
                        field="subsidy_disbursed_date" 
                        value={editData.subsidy_disbursed_date} 
                        onChange={handleChange} 
                        type="date" 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Subsidy Verification / Status" 
                        field="subsidy_status" 
                        value={editData.subsidy_status || editData.portal_status} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                </div>
            </section>
        </div>
    );
}

