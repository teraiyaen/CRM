import React, { useState, useEffect, useRef, memo } from 'react';
import { Zap, MapPin, User, Building2, Package, FolderOpen, ShieldCheck, Phone, Edit3, Truck, Calendar, Tag, CheckCircle2 } from 'lucide-react';
import { PRIMARY_STAGES } from '../constants';

const CustomerCard = memo(function CustomerCard({ customer, onSelect, onMoveStage, currentUser }) {
    const [showStageMenu, setShowStageMenu] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!showStageMenu) return;
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowStageMenu(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showStageMenu]);

    const name = customer.consumer_name || customer.customer_name || 'Unnamed Consumer';
    const phone = customer.mobile_no || customer.phone_number || 'N/A';
    const consumerNo = customer.consumer_number || customer.consumer_no || 'N/A';
    const appNo = customer.application_number || '';
    const capacity = customer.proposed_capacity_kw || customer.system_capacity_kwp || '0';
    const panel = customer.panel_brand || customer.module_brand || 'Not Assigned';
    const inverter = customer.inverter_brand || customer.inverter_make || '';
    const currentStatus = customer.portal_status || customer.status || customer.stage || 'Registration';
    const address = customer.address || customer.sub_division || customer.circle || customer.district_name || '';
    const dealer = customer.dealer || customer.channel_partner || 'Teraiya';
    const refAgent = customer.ref_agent || '';
    const submittedOn = customer.submitted_on || customer.application_date || '';

    const getStatusBadgeStyle = (st) => {
        const s = String(st).toLowerCase();
        if (s.includes('disbursed') || s.includes('complete')) {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (s.includes('installation')) {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }
        if (s.includes('inspection')) {
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        }
        if (s.includes('agreement') || s.includes('upload')) {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }
        if (s.includes('vendor') || s.includes('leads')) {
            return 'bg-teal-50 text-teal-700 border-teal-200';
        }
        return 'bg-stone-100 text-stone-700 border-stone-200';
    };

    return (
        <div 
            onClick={() => onSelect && onSelect(customer)}
            className="bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md rounded-xl p-4 transition-all cursor-pointer relative group flex flex-col justify-between"
        >
            <div className="space-y-2.5">
                {/* Header: Name + Stage badge */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h4 className="font-bold text-stone-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                            {name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500 font-mono">
                            <span>#{consumerNo}</span>
                            {appNo && <span className="text-stone-400">• {appNo}</span>}
                        </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadgeStyle(currentStatus)}`}>
                        {currentStatus}
                    </span>
                </div>

                {/* Technical / Specs Row */}
                <div className="grid grid-cols-2 gap-2 bg-stone-50/80 p-2.5 rounded-lg text-xs">
                    <div>
                        <span className="text-stone-400 text-[10px] uppercase font-semibold block">Capacity</span>
                        <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" /> {capacity} kWp
                        </span>
                    </div>
                    <div>
                        <span className="text-stone-400 text-[10px] uppercase font-semibold block">Panel OEM</span>
                        <span className="font-medium text-stone-700 truncate block mt-0.5" title={panel}>
                            {panel}
                        </span>
                    </div>
                </div>

                {/* Details list */}
                <div className="space-y-1 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{phone}</span>
                    </div>
                    {address && (
                        <div className="flex items-center gap-1.5 truncate text-stone-500">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{address}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span className="truncate font-medium text-stone-600">
                    {dealer}{refAgent ? ` • ${refAgent}` : ''}
                </span>
                {submittedOn && (
                    <span className="flex items-center gap-1 text-[10px]">
                        <Calendar className="w-3 h-3" /> {submittedOn}
                    </span>
                )}
            </div>
        </div>
    );
});

export default CustomerCard;
