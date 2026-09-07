import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
    UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, 
    RefreshCw, Clock, ArrowRight, Activity, Filter, Eye, AlertCircle
} from 'lucide-react';

export default function MISUploadView({ role = 'admin' }) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStats, setUploadStats] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [flaggedItems, setFlaggedItems] = useState([]);
    const [recentSyncs, setRecentSyncs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchRecentSyncStats();
    }, []);

    const fetchRecentSyncStats = async () => {
        setLoadingHistory(true);
        try {
            // Fetch total count and latest uploaded records from mis table
            const { data, error, count } = await supabase
                .from('mis')
                .select('*', { count: 'exact' })
                .order('uploaded_at', { ascending: false })
                .limit(50);

            if (!error && data) {
                // Calculate stage breakdown
                const stageCounts = {};
                const flags = [];
                data.forEach(row => {
                    const st = row.current_status_of_application || 'Unknown';
                    stageCounts[st] = (stageCounts[st] || 0) + 1;
                    
                    if (row.inspection_return_comment || row.feasibility_return_remarks || (row.last_comment && row.last_comment.toLowerCase().includes('reject'))) {
                        flags.push(row);
                    }
                });

                setUploadStats({
                    totalRecords: count || data.length,
                    stageCounts,
                    lastSyncDate: data.length > 0 ? new Date(data[0].uploaded_at).toLocaleString() : 'No sync recorded'
                });
                setFlaggedItems(flags);
                setRecentSyncs(data.slice(0, 15));
            }
        } catch (err) {
            console.error('Failed to fetch MIS sync history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Clean text and CSV parsing
    const parseCSVLine = (text) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                if (inQuotes && text[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setErrorMsg(null);
        setUploadProgress(10);

        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
            
            if (lines.length < 2) {
                throw new Error("The uploaded CSV file is empty or missing data rows.");
            }

            // Headers definition matching our 66 columns
            const headerKeys = [
                'application_number', 'serial_number', 'application_submitted_date',
                'consumer_registration_number', 'scheme', 'current_status_of_application',
                'consumer_name', 'mobile_no_of_consumer', 'email_of_consumer',
                'consumer_address', 'district_name', 'state_name', 'consumer_number',
                'vendor_selection_date_by_consumer', 'vendor_consent_date',
                'vendor_consumer_agreement_uploaded', 'vendor_consumer_agreement_uploading_date',
                'connection_category_name', 'sanction_load_kwp', 'proposed_pv_capacity_kwp',
                'discom_name', 'circle_name', 'division_name', 'sub_division_name',
                'has_existing_capacity', 'existing_capacity_kwp', 'loan_taken',
                'loan_application_date', 'loan_applied_at_bank', 'bank_branch_address',
                'loan_status', 'loan_sanctioned_date', 'loan_rejection_date',
                'loan_disbursed_date_first_tranche', 'loan_disbursed_amount_first_tranche',
                'loan_first_tranche_disbursal_utr', 'loan_disbursed_date_second_tranche',
                'loan_disbursed_amount_second_tranche', 'loan_second_tranche_disbursal_utr',
                'feasibility_applied_kw', 'feasibility_approved_date', 'feasibility_returned_date',
                'feasibility_return_remarks', 'solar_plant_installation_date',
                'installed_pv_module_capacity_kwp', 'pv_module_make', 'module_capacity_wp',
                'module_quantity', 'pv_module_serial_no', 'inverter_capacity_kw',
                'inverter_make', 'inverter_quantity', 'inspection_status', 'inspection_date',
                'inspection_return_date', 'inspection_return_comment', 'subsidy_redeem_date',
                'subsidy_amount', 'subsidy_return_date', 'subsidy_return_to',
                'subsidy_return_comment', 'subsidy_verified_date', 'subsidy_disbursed_date',
                'last_comment', 'last_comment_date', 'no_of_house_rwa'
            ];

            const rowsToInsert = [];
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                // Filter out empty rows or trailing formula rows
                if (values.length > 12) {
                    const consumerNo = values[12]?.replace(/["']/g, '').trim();
                    if (consumerNo && !['/', '-', '#N/A', ''].includes(consumerNo)) {
                        const rowObj = {};
                        headerKeys.forEach((key, idx) => {
                            let val = values[idx] || null;
                            if (val) {
                                val = val.replace(/^["']|["']$/g, '').trim();
                                if (val === '' || ['/', '-', '#N/A', 'null', 'nan'].includes(val.toLowerCase())) {
                                    val = null;
                                }
                            }
                            rowObj[key] = val;
                        });
                        rowsToInsert.push(rowObj);
                    }
                }
            }

            if (rowsToInsert.length === 0) {
                throw new Error("No valid consumer records found in the uploaded file.");
            }

            setUploadProgress(30);

            // Batch insert into `mis` table (chunks of 100 to avoid request size limits)
            const chunkSize = 100;
            const totalChunks = Math.ceil(rowsToInsert.length / chunkSize);

            for (let c = 0; c < totalChunks; c++) {
                const chunk = rowsToInsert.slice(c * chunkSize, (c + 1) * chunkSize);
                const { error } = await supabase.from('mis').insert(chunk);
                if (error) {
                    console.error("Supabase insert error on chunk", c, error);
                    throw error;
                }
                const currentPct = 30 + Math.round(((c + 1) / totalChunks) * 60);
                setUploadProgress(currentPct);
            }

            setUploadProgress(100);
            await fetchRecentSyncStats();
            alert(`🎉 Success! Uploaded and synchronized ${rowsToInsert.length} consumer records with the CRM.`);
        } catch (err) {
            console.error("Upload failed:", err);
            setErrorMsg(err.message || "Failed to upload and process MIS sheet.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (e.target) e.target.value = '';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-7 h-7 text-amber-500" />
                        PM Surya Ghar — MIS Automated Portal Sync
                    </h1>
                    <p className="text-sm text-stone-500 mt-1">
                        Upload raw National Portal MIS export sheets to automatically update customer stages, tranches, and inspection notes in real-time.
                    </p>
                </div>
                <button 
                    onClick={fetchRecentSyncStats} 
                    disabled={loadingHistory}
                    className="flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                    Refresh Sync Status
                </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold">Sync Failed:</span> {errorMsg}
                    </div>
                </div>
            )}

            {/* Upload Box */}
            <div className="bg-white border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-8 text-center transition-all bg-gradient-to-b from-amber-50/40 to-white">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-stone-900">Upload PM Surya Ghar MIS Sheet</h3>
                        <p className="text-xs text-stone-500 mt-1">
                            Accepts standard National Portal CSV exports with 66 official columns. Empty formula rows are automatically filtered.
                        </p>
                    </div>

                    {uploading ? (
                        <div className="space-y-2 py-4">
                            <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs font-medium text-stone-600">Uploading & Syncing: {uploadProgress}%</p>
                        </div>
                    ) : (
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded-xl cursor-pointer shadow-sm hover:shadow transition-all">
                            <FileSpreadsheet className="w-4 h-4" />
                            Select MIS CSV File
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleFileUpload} 
                                className="hidden" 
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* Top Metrics Cards */}
            {uploadStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Synced In MIS</div>
                        <div className="text-2xl font-black text-stone-900 mt-2">{uploadStats.totalRecords}</div>
                        <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Last Synced: {uploadStats.lastSyncDate}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Subsidy Disbursed</div>
                        <div className="text-2xl font-black text-emerald-700 mt-2">{uploadStats.stageCounts?.['Subsidy Disbursal'] || 0}</div>
                        <div className="text-xs text-emerald-600 mt-1 font-medium">Completed Projects</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">In Progress</div>
                        <div className="text-2xl font-black text-blue-700 mt-2">
                            {(uploadStats.stageCounts?.['Installation'] || 0) + 
                             (uploadStats.stageCounts?.['Upload Agreement'] || 0) + 
                             (uploadStats.stageCounts?.['Inspection'] || 0)}
                        </div>
                        <div className="text-xs text-blue-600 mt-1 font-medium">Active Pipelines</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                        <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Flagged Queries</div>
                        <div className="text-2xl font-black text-rose-700 mt-2">{flaggedItems.length}</div>
                        <div className="text-xs text-rose-600 mt-1 font-medium">Inspection / Feasibility Notes</div>
                    </div>
                </div>
            )}

            {/* Flagged Attention Items */}
            {flaggedItems.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                    <div className="bg-amber-50/80 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            <h3 className="font-bold text-amber-950">Action Required: Flagged Portal Queries ({flaggedItems.length})</h3>
                        </div>
                        <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">Requires Attention</span>
                    </div>
                    <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
                        {flaggedItems.map((item, idx) => (
                            <div key={idx} className="p-4 hover:bg-stone-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
                                <div className="space-y-1">
                                    <div className="font-semibold text-stone-900 flex items-center gap-2">
                                        <span>{item.consumer_name}</span>
                                        <span className="text-xs font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600">{item.consumer_number}</span>
                                        <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                            {item.current_status_of_application}
                                        </span>
                                    </div>
                                    <div className="text-xs text-stone-500">
                                        Discom: {item.discom_name} • Sub Div: {item.sub_division_name} • Mobile: {item.mobile_no_of_consumer}
                                    </div>
                                    {item.inspection_return_comment && (
                                        <div className="text-xs text-rose-700 bg-rose-50/80 px-2.5 py-1.5 rounded-lg border border-rose-100 mt-1">
                                            <strong>Inspection Comment:</strong> {item.inspection_return_comment}
                                        </div>
                                    )}
                                    {item.feasibility_return_remarks && (
                                        <div className="text-xs text-amber-700 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-100 mt-1">
                                            <strong>Feasibility Remark:</strong> {item.feasibility_return_remarks}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
