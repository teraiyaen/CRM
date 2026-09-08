// ─── CustomerDetailModal.jsx ──────────────────────────────────────────────────
// PM Surya Ghar Customer Detail Modal configured for public.admin schema.
// 7 Stage tabs (Registration, Feasibility, Agreement, Installation, Inspection, Subsidy Claim, DBT Disbursal) + Notes.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import {
    X, Edit3, Trash2, Save, Send, AlertTriangle, CheckSquare,
    User, Zap, IndianRupee, Building2, FolderOpen, MapPin,
    LayoutDashboard, History, Plus, ShieldCheck, Lock, Unlock, ClipboardList, Banknote, Tag, Mail, PauseCircle, Check,
    Eye, Search, Image as ImageIcon, MessageSquare, Calendar, Wrench, Gauge, CheckCircle2, Printer
} from "lucide-react";
import { PRIMARY_STAGES, STAGE_IDS, ADMIN_COLUMNS, ADMIN_NUMERIC_COLUMNS } from "../constants";
import { logActivity, formatDateToDDMMYYYY, formatINR, parseIndianNumber, sanitizePhoneNumber, sanitizeAdminUpdate } from "../utils";
import { supabase } from "../supabase";
import { AgreementPreview } from "./agreement/AgreementPreview";
import CustomerModalTabsRouter from "./CustomerModalTabsRouter";
import HistoryTab from "./modal-tabs/HistoryTab";
import { useGlobalPopup } from "./GlobalPopup";
import ConflictResolutionModal from "./ConflictResolutionModal";

const getChangedFields = (draft = {}, saved = {}) => {
    const changed = new Set();
    const ignoreKeys = new Set(["id", "created_at", "updated_at", "crn"]);
    const keys = new Set([...Object.keys(saved || {}), ...Object.keys(draft || {})]);

    keys.forEach(key => {
        if (ignoreKeys.has(key)) return;
        const draftValue = draft?.[key];
        const savedValue = saved?.[key];
        if (typeof draftValue === "boolean" || typeof savedValue === "boolean") {
            if (Boolean(draftValue) !== Boolean(savedValue)) changed.add(key);
            return;
        }
        const draftEmpty = draftValue === undefined || draftValue === null || draftValue === "";
        const savedEmpty = savedValue === undefined || savedValue === null || savedValue === "";
        if (draftEmpty && savedEmpty) return;
        if (typeof draftValue === "object" || typeof savedValue === "object") {
            if (JSON.stringify(draftValue ?? null) !== JSON.stringify(savedValue ?? null)) changed.add(key);
            return;
        }
        if (String(draftValue ?? "").trim() !== String(savedValue ?? "").trim()) changed.add(key);
    });

    return changed;
};

const UNIFIED_TABS = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'technical', label: 'Technical & Plant', icon: Zap },
    { id: 'finance', label: 'Loan & Subsidy', icon: IndianRupee },
    { id: 'logs', label: 'Remarks & Logs', icon: History },
];

const mapToUnifiedTab = (raw) => {
    const t = String(raw || '').toLowerCase();
    if (t === 'basic' || t === 'technical' || t === 'finance' || t === 'logs') return t;
    if (t.includes('loan') || t.includes('subsid') || t.includes('pay') || t.includes('claim') || t.includes('disburs') || t.includes('cash')) {
        return 'finance';
    }
    if (t.includes('install') || t.includes('plant') || t.includes('tech') || t.includes('feas') || t.includes('inspect') || t.includes('meter')) {
        return 'technical';
    }
    if (t.includes('log') || t.includes('hist') || t.includes('note') || t.includes('remark')) {
        return 'logs';
    }
    return 'basic';
};

export default function CustomerDetailModal({ customer, onClose, onUpdate, onDelete, user, meta, channel_partners = [], defaultTab }) {
    const { showAlert, showConfirm } = useGlobalPopup();
    
    // Determine active tab based on defaultTab or fallback to 'basic'
    const [activeTab, setActiveTab] = useState(() => mapToUnifiedTab(defaultTab));


    const [editingSection, setEditingSection] = useState(null);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [editData, setEditData] = useState({ ...customer });
    const savedDataRef = useRef({ ...customer });
    const loadedUpdatedAtRef = useRef(customer?.updated_at || null);
    const [concurrentConflict, setConcurrentConflict] = useState(null);
    const lastSelfWriteRef = useRef(0);
    const [followUpText, setFollowUpText] = useState("");
    const [saving, setSaving] = useState(false);
    const [validationIssues, setValidationIssues] = useState([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [activityLogs, setActivityLogs] = useState([]);
    const [showAgreementPopup, setShowAgreementPopup] = useState(false);
    const [agreementData, setAgreementData] = useState({});

    const isAdmin = user?.userType === "admin";
    const isOffice = user?.userType === "sales" || user?.userType === "office" || user?.role?.toLowerCase().includes("office");
    const isAgent = user?.userType === "agent";
    const isCompleted = (customer?.portal_status || customer?.status || "").toUpperCase().includes("DISBURS");
    const [adminUnlocked, setAdminUnlocked] = useState(false);
    const isFrozen = isCompleted && !(isAdmin && adminUnlocked);
    const isEditable = !isFrozen;

    const handleEditDataChange = (updater) => {
        setEditData(previous => {
            const next = typeof updater === "function" ? updater(previous) : updater;
            setIsFormDirty(getChangedFields(next, savedDataRef.current).size > 0);
            return next;
        });
    };

    // Realtime sync on admin table
    useEffect(() => {
        if (!customer?.id || String(customer.id).startsWith("demo-")) return;
        
        const channel = supabase.channel(`customer_modal_concurrency_${customer.id}`)
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "admin",
                filter: `id=eq.${customer.id}`
            }, (payload) => {
                if (payload.new) {
                    const serverRecord = payload.new;
                    const isOwnWrite =
                        (serverRecord.updated_at && serverRecord.updated_at === loadedUpdatedAtRef.current) ||
                        (Date.now() - lastSelfWriteRef.current) < 5000;

                    if (!isFormDirty) {
                        loadedUpdatedAtRef.current = serverRecord.updated_at || loadedUpdatedAtRef.current;
                        savedDataRef.current = { ...serverRecord };
                        setEditData({ ...serverRecord });
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [customer?.id, isFormDirty]);

    // Refresh data in background on mount
    useEffect(() => {
        if (!customer?.id || String(customer.id).startsWith("demo-")) return;
        supabase.from("admin").select("*").eq("id", customer.id).single().then(({ data }) => {
            if (data) {
                loadedUpdatedAtRef.current = data.updated_at || loadedUpdatedAtRef.current;
                savedDataRef.current = { ...data };
                if (!isFormDirty) {
                    setEditData({ ...data });
                }
            }
        });
    }, [customer?.id]);

    const fetchLogs = useCallback(async () => {
        try {
            if (!customer?.id) return;
            const custName = (customer.consumer_name || customer.customer_name || "").trim();
            const custNo = (customer.consumer_number || customer.consumer_no || "").trim();
            let filters = [`customer_id.eq.${customer.id}`, `new_value.eq.${customer.id}`];
            if (custName) filters.push(`message.ilike.%${custName}%`);
            if (custNo) filters.push(`message.ilike.%${custNo}%`);

            const { data, error } = await supabase.from("activity_log").select("*, profiles(name)")
                .or(filters.join(','))
                .order("created_at", { ascending: false }).limit(50);
            if (!error && data) setActivityLogs(data);
        } catch (err) {
            console.warn("Could not load customer activity logs:", err);
        }
    }, [customer?.id, customer?.consumer_name, customer?.customer_name, customer?.consumer_number, customer?.consumer_no]);


    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleChange = (field, val) => {
        if (field === "consumer_number" || field === "consumer_no") {
            val = String(val).replace(/[^0-9]/g, "");
        }
        if (field === "mobile_no" || field === "phone_number") {
            val = sanitizePhoneNumber(val);
        }
        setEditData(prev => {
            const next = { ...prev, [field]: val };
            setIsFormDirty(getChangedFields(next, savedDataRef.current).size > 0);
            return next;
        });
    };

    const handleSectionUpdate = async (id, patch) => {
        lastSelfWriteRef.current = Date.now();
        const result = await onUpdate(id, patch);
        if (result === false) return false;
        savedDataRef.current = { ...savedDataRef.current, ...patch };
        setEditData(previous => {
            const next = { ...previous, ...patch };
            setIsFormDirty(getChangedFields(next, savedDataRef.current).size > 0);
            return next;
        });
        return result;
    };

    // Stage advance calculation based on customer's current workflow stage (portal_status / status)
    const validStages = PRIMARY_STAGES.filter(s => s.id !== "ALL");
    const currentStageStatus = editData.portal_status || editData.status || "VENDER SELECTION";
    const foundStageIdx = validStages.findIndex(s => s.id.toUpperCase() === String(currentStageStatus).toUpperCase());
    const hasNextStage = foundStageIdx >= 0 && foundStageIdx < validStages.length - 1;
    const nextStageId = hasNextStage ? validStages[foundStageIdx + 1].id : null;
    const nextStageLabel = hasNextStage ? validStages[foundStageIdx + 1].label : "";

    const getMissingStageRequirements = () => {
        const issues = [];
        const requireField = (condition, label) => { if (!condition) issues.push(label); };

        const statusUpper = String(currentStageStatus).toUpperCase();
        if (statusUpper.includes("VENDER") || statusUpper.includes("REGISTRATION")) {
            requireField(editData.consumer_name?.trim(), "Consumer Name");
            requireField(editData.consumer_number?.toString().trim(), "Consumer Number");
            requireField(editData.mobile_no?.toString().trim(), "Mobile Number");
        } else if (statusUpper.includes("AGREEMENT")) {
            requireField(editData.dealer?.trim(), "Dealer / Channel Partner");
        } else if (statusUpper.includes("INSTALLATION")) {
            requireField(editData.panel_brand?.trim(), "Panel Brand");
            requireField(editData.inverter_brand?.trim(), "Inverter Brand");
        }
        return issues;
    };


    const showMissingRequirements = (issues) => {
        setValidationIssues(issues);
        setShowValidationModal(true);
    };

    const handleAdvanceStage = async (overrideNextStageId) => {
        const destStageId = overrideNextStageId || nextStageId;
        if (!destStageId) return;

        const missingRequirements = getMissingStageRequirements();
        if (missingRequirements.length > 0) {
            showMissingRequirements(missingRequirements);
            return;
        }

        setSaving(true);
        const oldStage = editData.portal_status || editData.status || activeTab;
        const updates = {
            ...editData,
            portal_status: destStageId,
            status: destStageId,
        };

        const cleanUpdates = sanitizeAdminUpdate(updates);
        delete cleanUpdates.id;
        delete cleanUpdates.created_at;
        delete cleanUpdates.updated_at;

        lastSelfWriteRef.current = Date.now();
        try {
            const ok = await onUpdate(customer.id, cleanUpdates);
            if (ok === false) throw new Error("The database did not accept the stage change.");

            savedDataRef.current = { ...savedDataRef.current, ...cleanUpdates };
            setEditData(prev => ({ ...prev, ...cleanUpdates }));
            setActiveTab(destStageId);

            const cName = customer.consumer_name || customer.customer_name || "Consumer";
            void logActivity(user.id, "stage_change", `${cName}: STAGE: ${oldStage} → ${destStageId}`, "", customer.id);
            void fetchLogs();
        } catch (err) {
            console.error("Stage advance failed:", err);
            showAlert(`The stage was NOT changed.\n\n${err.message || "Unknown error"}`, { type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async (forceOverwrite = false) => {
        setSaving(true);
        const updates = { ...editData };

        // Concurrency Conflict Check before writing
        if (!forceOverwrite && customer?.id && !String(customer.id).startsWith("demo-") && loadedUpdatedAtRef.current) {
            try {
                const { data: serverRecord, error: checkErr } = await supabase
                    .from("admin")
                    .select("*")
                    .eq("id", customer.id)
                    .single();

                if (!checkErr && serverRecord && serverRecord.updated_at) {
                    const serverTime = new Date(serverRecord.updated_at).getTime();
                    const localTime = new Date(loadedUpdatedAtRef.current).getTime();

                    if (serverTime > localTime + 1000) {
                        const localChangedSet = getChangedFields(updates, savedDataRef.current);
                        const remoteChangedSet = getChangedFields(serverRecord, savedDataRef.current);
                        const localChanges = Array.from(localChangedSet);
                        const overlappingFields = localChanges.filter(
                            k => remoteChangedSet.has(k) && JSON.stringify(serverRecord[k]) !== JSON.stringify(updates[k])
                        );

                        if (overlappingFields.length > 0) {
                            setSaving(false);
                            setConcurrentConflict({
                                serverData: serverRecord,
                                localUpdates: updates,
                                localChanges: overlappingFields,
                                remoteChanges: overlappingFields,
                                overlappingFields,
                                serverUpdatedAt: serverRecord.updated_at
                            });
                            return false;
                        }
                    }
                }
            } catch (concurrencyErr) {
                console.warn("Concurrency check warning:", concurrencyErr);
            }
        }

        const cleanUpdates = sanitizeAdminUpdate(updates);
        delete cleanUpdates.id;
        delete cleanUpdates.created_at;
        delete cleanUpdates.updated_at;

        const changedKeys = getChangedFields(cleanUpdates, savedDataRef.current);
        const narrowedUpdates = {};
        changedKeys.forEach(key => {
            if (ADMIN_COLUMNS.has(key)) {
                narrowedUpdates[key] = cleanUpdates[key];
            }
        });

        if (Object.keys(narrowedUpdates).length === 0) {
            setEditingSection(null);
            setIsFormDirty(false);
            setSaving(false);
            return true;
        }

        lastSelfWriteRef.current = Date.now();
        try {
            const updateResult = await onUpdate(customer.id, narrowedUpdates);
            if (updateResult === false) throw new Error("The database did not accept the changes.");

            const { data: savedRow } = await supabase
                .from("admin")
                .select("*")
                .eq("id", customer.id)
                .maybeSingle();

            if (savedRow) {
                savedDataRef.current = { ...savedRow };
                loadedUpdatedAtRef.current = savedRow.updated_at || new Date().toISOString();
                setEditData(prev => ({ ...prev, ...savedRow }));
            } else {
                savedDataRef.current = { ...savedDataRef.current, ...narrowedUpdates };
                loadedUpdatedAtRef.current = new Date().toISOString();
            }

            setConcurrentConflict(null);
            setEditingSection(null);
            setIsFormDirty(false);
            const cName = customer.consumer_name || customer.customer_name || "Consumer";
            void logActivity(user.id, "update", `${cName}: Updated record details`, "", customer.id);
            void fetchLogs();
            return true;
        } catch (err) {
            console.error("Save failed:", err);
            showAlert(`Your changes were not saved. Please try again.\n\n${err.message || ""}`, { type: "error" });
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleAddNote = async () => {
        if (!followUpText.trim()) return;
        const currentRemarks = editData.remarks || "";
        const formattedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const newRemarkEntry = `[${formattedDate} - ${user.name || "Staff"}]: ${followUpText.trim()}`;
        const updatedRemarks = currentRemarks ? `${currentRemarks}\n${newRemarkEntry}` : newRemarkEntry;

        if (await handleSectionUpdate(customer.id, { remarks: updatedRemarks }) === false) return;
        const cName = customer.consumer_name || customer.customer_name || "Consumer";
        await logActivity(user.id, "note", `Note Added for ${cName}: ${followUpText}`, "", customer.id);
        setEditData(prev => ({ ...prev, remarks: updatedRemarks }));
        setFollowUpText("");
        fetchLogs();
    };

    const handleGenerateAgreement = () => {
        setAgreementData({
            executionDate: formatDateToDDMMYYYY(editData.submitted_on || new Date().toISOString()),
            consumerName: editData.consumer_name || editData.customer_name || "",
            consumerNo: editData.consumer_number || editData.consumer_no || "",
            village: editData.address || editData.villages || "",
            taluka: editData.sub_division || editData.villages || "",
            district: editData.division || editData.sub_divisions || "",
            vendorName: editData.dealer || "Teriyan Enterprises",
            vendorAddress: "Plot No. 12, GIDC Industrial Estate, Near Power Grid Substation, Radhanpur, Patan, Gujarat - 385340",
            paymentTerms: "Mutually Agreed Terms of Payment",
            firstPartySignature: "",
            secondPartyStamp: "./stamp.png",
            secondPartySignature: "",
            highlightColor: "#fef08a",
            showHighlights: true,
        });
        setShowAgreementPopup(true);
    };

    const tabProps = {
        activeTab,
        customer: savedDataRef.current,
        editData,
        setEditData: handleEditDataChange,
        handleChange,
        isEditable,
        editingSection,
        setEditingSection,
        channel_partners,
        isAdmin,
        isOffice,
        meta,
        user,
        saving,
        setSaving,
        handleAdvanceStage,
        onGenerateAgreement: handleGenerateAgreement,
        onUpdate: handleSectionUpdate,
        followUpText,
        setFollowUpText,
        handleAddNote,
        activityLogs,
        logActivity,
        fetchLogs,
    };

    const displayName = editData.consumer_name || editData.customer_name || customer.consumer_name || customer.customer_name || "Consumer Details";
    const displayConsumerNo = editData.consumer_number || editData.consumer_no || customer.consumer_number || customer.consumer_no || "N/A";


    return (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-5xl h-[94vh] overflow-hidden flex flex-col border border-stone-100">

                {/* Header */}
                <div className="bg-stone-900 px-6 py-5 flex justify-between items-center flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-white">{displayName}</h2>
                            <span className="text-xs font-mono text-stone-400 bg-white/10 px-2.5 py-0.5 rounded-lg">
                                #{displayConsumerNo}
                            </span>
                            {isCompleted && (
                                <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${isFrozen ? "bg-stone-700 text-stone-400" : "bg-amber-500/20 text-amber-400"}`}>
                                    {isFrozen ? <><Lock size={9} /> Frozen</> : <><Unlock size={9} /> Unlocked</>}
                                </span>
                            )}
                        </div>
                        {customer.created_at && (
                            <p className="text-[11px] text-stone-400 font-medium mt-0.5 flex items-center gap-1.5">
                                <Calendar size={11} className="text-stone-400 flex-shrink-0" />
                                <span>Created: {new Date(customer.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })} IST</span>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isCompleted && isAdmin && (
                            <button onClick={() => { setAdminUnlocked(prev => !prev); setEditingSection(null); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${adminUnlocked ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"}`}>
                                {adminUnlocked ? <><Lock size={12} /> Re-lock</> : <><Unlock size={12} /> Unlock to Edit</>}
                            </button>
                        )}
                        <button onClick={async () => {
                            if (isFormDirty) {
                                const shouldSave = await showConfirm("You have unsaved changes. Save them before closing?", { title: "Unsaved changes", confirmLabel: "Save & Close", cancelLabel: "Keep Editing", type: "success" });
                                if (!shouldSave || !(await handleSave())) return;
                            }
                            onClose();
                        }} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer"><X size={24} /></button>
                    </div>
                </div>

                {/* 4 Clean Unified Navigation Tabs */}
                <div className="flex bg-stone-900 px-6 gap-6 border-t border-white/5 flex-shrink-0 overflow-x-auto scrollbar-none whitespace-nowrap">
                    {UNIFIED_TABS.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={async () => {
                                if (tab.id !== activeTab && isFormDirty) {
                                    const shouldSave = await showConfirm("You have unsaved changes. Save them before continuing?", { title: "Unsaved changes", confirmLabel: "Save & Continue", cancelLabel: "Keep Editing", type: "success" });
                                    if (!shouldSave || !(await handleSave())) return;
                                }
                                setActiveTab(tab.id); 
                                setEditingSection(null);
                            }}
                            className={`flex items-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex-shrink-0 cursor-pointer ${activeTab === tab.id ? "text-amber-400 border-amber-400" : "text-stone-400 border-transparent hover:text-stone-200"}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Modal Body */}
                <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-[#FCFBFA]">
                    {/* Primary Stage Overview Banner */}
                    {activeTab !== "logs" && activeTab !== "history" && (

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-2xl border border-stone-100 bg-white shadow-xs flex flex-col justify-between">
                                <div>
                                    <label className="text-[9px] text-stone-400 font-bold uppercase mb-1.5 block">Current Stage Status</label>
                                    <div className="text-xs text-stone-850 font-bold px-3 py-1.5 bg-stone-50 border border-stone-200/80 rounded-xl inline-flex items-center gap-1.5">
                                        <CheckCircle2 size={13} className="text-amber-500" />
                                        {editData.portal_status || PRIMARY_STAGES.find(s => s.id === currentStageStatus)?.label || currentStageStatus}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-stone-100 bg-white shadow-xs flex flex-col justify-between">
                                <div>
                                    <label className="text-[9px] text-stone-400 font-bold uppercase mb-1.5 flex items-center justify-between">
                                        <span>Stage Comment / Remarks</span>
                                        {isEditable && <span className="text-[9px] text-amber-600 font-semibold">Editable</span>}
                                    </label>
                                    {isEditable ? (
                                        <input
                                            type="text"
                                            value={editData.remarks || ''}
                                            onChange={e => handleChange('remarks', e.target.value)}
                                            placeholder="Type stage remarks / comment here..."
                                            className="w-full text-xs font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-stone-400"
                                        />
                                    ) : (
                                        <p className="text-xs text-stone-600 font-medium truncate">
                                            {editData.remarks || "No remarks recorded for this application."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage / Tab Content */}
                    <CustomerModalTabsRouter {...tabProps} />
                </div>

                {/* Footer Bar */}
                {isEditable && (
                    <div className="p-4 border-t border-stone-100 bg-white flex-shrink-0 flex gap-3">
                        <button
                            onClick={() => handleSave()}
                            disabled={saving}
                            className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs cursor-pointer shadow-sm disabled:opacity-50 ${
                                isFormDirty
                                    ? "bg-stone-900 text-white hover:bg-stone-800"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                        >
                            {saving ? (
                                "Saving..."
                            ) : isFormDirty ? (
                                <>
                                    <Save size={14} />
                                    <span>Save Details</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} className="text-white" />
                                    <span>All Saved</span>
                                </>
                            )}
                        </button>

                        {hasNextStage && (
                            <button
                                onClick={() => handleAdvanceStage()}
                                disabled={saving}
                                className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                            >
                                {saving ? "Moving..." : `Save & Move to ${nextStageLabel}`}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Validation Issues Modal */}
            {showValidationModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm" onClick={() => setShowValidationModal(false)}>
                    <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 px-6 py-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-white/20 p-2.5"><AlertTriangle size={21} /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-50">Validation Notice</p>
                                        <h3 className="mt-0.5 text-lg font-black">Missing Required Fields</h3>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowValidationModal(false)} className="rounded-lg p-1 text-white/90 hover:bg-white/15 hover:text-white"><X size={19} /></button>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm font-medium text-stone-600">Please fill the following required items before moving to <span className="font-bold text-stone-800">{nextStageLabel}</span>:</p>
                            <ul className="mt-4 space-y-2.5">
                                {validationIssues.map((issue, idx) => (
                                    <li key={idx} className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-800">
                                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-rose-500 text-xs font-black text-white">!</span>
                                        <span>{issue}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-5 flex justify-end">
                                <button type="button" onClick={() => setShowValidationModal(false)} className="rounded-xl bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer">
                                    Got It
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* PM Surya Ghar Agreement Popup */}
            {showAgreementPopup && (
                <AgreementPreview
                    data={agreementData}
                    onChange={setAgreementData}
                    onClose={() => setShowAgreementPopup(false)}
                />
            )}

            {/* Concurrency Conflict Modal */}
            <ConflictResolutionModal
                isOpen={Boolean(concurrentConflict)}
                conflict={concurrentConflict}
                onOverwrite={() => { setConcurrentConflict(null); handleSave(true); }}
                onMergeAndSave={() => {
                    if (!concurrentConflict?.serverData) return;
                    setEditData(prev => ({ ...concurrentConflict.serverData, ...prev }));
                    setConcurrentConflict(null);
                    setTimeout(() => handleSave(true), 50);
                }}
                onDiscardAndReload={() => {
                    if (!concurrentConflict?.serverData) return;
                    setEditData({ ...concurrentConflict.serverData });
                    savedDataRef.current = { ...concurrentConflict.serverData };
                    setConcurrentConflict(null);
                }}
                onClose={() => setConcurrentConflict(null)}
            />
        </div>
    );
}
