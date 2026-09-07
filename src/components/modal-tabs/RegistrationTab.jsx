import React from 'react';
import { User, ClipboardList, Edit3, X, Zap, Calendar, MapPin, Building2, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { EditableDetailItem } from './shared';

export default function RegistrationTab({
    editData,
    handleChange,
    editingSection,
    setEditingSection,
    isEditable,
    channel_partners = [],
}) {
    const isEditing = editingSection === 'reg_details';

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Consumer Information Section */}
            <section id="section-consumer_info" className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <User size={14} className="text-amber-500" /> Consumer Information
                    </h3>
                    {isEditable && (
                        <button 
                            type="button"
                            onClick={() => {
                                const isOpening = editingSection !== 'reg_details';
                                if (setEditingSection) setEditingSection(isOpening ? 'reg_details' : null);
                            }} 
                            className="text-stone-400 hover:text-amber-600 transition-colors p-1 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        >
                            {isEditing ? <><X size={14} /> Close Edit</> : <><Edit3 size={13} /> Edit Details</>}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <EditableDetailItem 
                        label="Consumer Name *" 
                        field="consumer_name" 
                        value={editData.consumer_name} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Consumer Number *" 
                        field="consumer_number" 
                        value={editData.consumer_number} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Mobile Number *" 
                        field="mobile_no" 
                        value={editData.mobile_no} 
                        onChange={handleChange} 
                        type="tel"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Email Address" 
                        field="email" 
                        value={editData.email} 
                        onChange={handleChange} 
                        type="email"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Address / Village" 
                        field="address" 
                        value={editData.address} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Sub Division" 
                        field="sub_division" 
                        value={editData.sub_division} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Division" 
                        field="division" 
                        value={editData.division} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Circle" 
                        field="circle" 
                        value={editData.circle} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="DISCOM Name" 
                        field="discom_name" 
                        value={editData.discom_name} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                </div>
            </section>

            {/* Application & Portal Details Section */}
            <section id="section-app_details" className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-1">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={14} className="text-amber-500" /> Portal & Application Meta
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <EditableDetailItem 
                        label="Application Number" 
                        field="application_number" 
                        value={editData.application_number} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="SR No" 
                        field="sr_no" 
                        value={editData.sr_no} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Application Date" 
                        field="application_date" 
                        value={editData.application_date} 
                        onChange={handleChange} 
                        type="date"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Submitted On" 
                        field="submitted_on" 
                        value={editData.submitted_on} 
                        onChange={handleChange} 
                        type="date"
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Dealer / Channel Partner" 
                        field="dealer" 
                        value={editData.dealer} 
                        onChange={handleChange} 
                        channel_partners={channel_partners}
                        isEditing={isEditing} 
                    />
                    <EditableDetailItem 
                        label="Referral Agent" 
                        field="ref_agent" 
                        value={editData.ref_agent} 
                        onChange={handleChange} 
                        isEditing={isEditing} 
                    />
                    {/* Lead Source / Origin (Hidden per user request) */}
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                        <p className="text-[9px] text-stone-400 uppercase tracking-wide mb-1 font-bold">Interested in Solar</p>
                        {isEditing ? (
                            <select 
                                value={editData.is_interested !== false ? 'true' : 'false'} 
                                onChange={e => handleChange('is_interested', e.target.value === 'true')}
                                className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                            >
                                <option value="true">Yes (Interested)</option>
                                <option value="false">No (Not Interested)</option>
                            </select>
                        ) : (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${editData.is_interested !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                                {editData.is_interested !== false ? 'Yes (Interested)' : 'Not Interested'}
                            </span>
                        )}
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                        <p className="text-[9px] text-stone-400 uppercase tracking-wide mb-1 font-bold">Duplicate SR No Flag</p>
                        {isEditing ? (
                            <select 
                                value={editData.is_duplicate_sr_no ? 'true' : 'false'} 
                                onChange={e => handleChange('is_duplicate_sr_no', e.target.value === 'true')}
                                className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                            >
                                <option value="false">Unique (Normal)</option>
                                <option value="true">Duplicate SR No</option>
                            </select>
                        ) : (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${editData.is_duplicate_sr_no ? 'bg-rose-50 text-rose-700' : 'bg-stone-100 text-stone-600'}`}>
                                {editData.is_duplicate_sr_no ? 'Duplicate SR' : 'Unique (Normal)'}
                            </span>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
