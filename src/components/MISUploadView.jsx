import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx';
import { 
    UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, 
    RefreshCw, Clock, ArrowRight, Activity, Filter, Eye, AlertCircle, 
    History, Diff, Search, UserPlus, CheckCircle, Database, ChevronRight,
    SlidersHorizontal, Sparkles
} from 'lucide-react';

const STANDARD_HEADERS = [
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

const HEADER_SYNONYMS = {
    'applicationnumber': 'application_number',
    'applicationno': 'application_number',
    'appno': 'application_number',
    'serialnumber': 'serial_number',
    'srno': 'serial_number',
    'sno': 'serial_number',
    'applicationsubmitteddate': 'application_submitted_date',
    'submitteddate': 'application_submitted_date',
    'consumerregistrationnumber': 'consumer_registration_number',
    'scheme': 'scheme',
    'currentstatusofapplication': 'current_status_of_application',
    'currentstatus': 'current_status_of_application',
    'status': 'current_status_of_application',
    'consumername': 'consumer_name',
    'mobilenoofconsumer': 'mobile_no_of_consumer',
    'mobileno': 'mobile_no_of_consumer',
    'mobile': 'mobile_no_of_consumer',
    'emailofconsumer': 'email_of_consumer',
    'email': 'email_of_consumer',
    'consumeraddress': 'consumer_address',
    'address': 'consumer_address',
    'districtname': 'district_name',
    'district': 'district_name',
    'statename': 'state_name',
    'state': 'state_name',
    'consumernumber': 'consumer_number',
    'consumerno': 'consumer_number',
    'canumber': 'consumer_number',
    'cano': 'consumer_number',
    'accountnumber': 'consumer_number',
    'vendorselectiondatebyconsumer': 'vendor_selection_date_by_consumer',
    'vendorconsentdate': 'vendor_consent_date',
    'vendorconsumeragreementuploaded': 'vendor_consumer_agreement_uploaded',
    'vendorconsumeragreementuploadingdate': 'vendor_consumer_agreement_uploading_date',
    'connectioncategoryname': 'connection_category_name',
    'connectioncategory': 'connection_category_name',
    'sanctionloadkwp': 'sanction_load_kwp',
    'sanctionloadkw': 'sanction_load_kwp',
    'sanctionload': 'sanction_load_kwp',
    'proposedpvcapacitykwp': 'proposed_pv_capacity_kwp',
    'proposedpvcapacitykw': 'proposed_pv_capacity_kwp',
    'proposedpvcapacity': 'proposed_pv_capacity_kwp',
    'discomname': 'discom_name',
    'discom': 'discom_name',
    'circlename': 'circle_name',
    'circle': 'circle_name',
    'divisionname': 'division_name',
    'division': 'division_name',
    'subdivisionname': 'sub_division_name',
    'subdivision': 'sub_division_name',
    'hasexistingcapacity': 'has_existing_capacity',
    'existingcapacitykwp': 'existing_capacity_kwp',
    'loantaken': 'loan_taken',
    'loanapplicationdate': 'loan_application_date',
    'loanappliedatbank': 'loan_applied_at_bank',
    'bankbranchaddress': 'bank_branch_address',
    'loanstatus': 'loan_status',
    'loansanctioneddate': 'loan_sanctioned_date',
    'loanrejectiondate': 'loan_rejection_date',
    'loandisburseddatefirsttranche': 'loan_disbursed_date_first_tranche',
    'firsttranchedatetime': 'loan_disbursed_date_first_tranche',
    'firsttranchedate': 'loan_disbursed_date_first_tranche',
    '1sttranchedate': 'loan_disbursed_date_first_tranche',
    'loandisbursedamountfirsttranche': 'loan_disbursed_amount_first_tranche',
    'firsttrancheamount': 'loan_disbursed_amount_first_tranche',
    '1sttrancheamount': 'loan_disbursed_amount_first_tranche',
    'loanfirsttranchedisbursalutr': 'loan_first_tranche_disbursal_utr',
    'firsttrancheutr': 'loan_first_tranche_disbursal_utr',
    'loandisburseddatesecondtranche': 'loan_disbursed_date_second_tranche',
    'secondtranchedatetime': 'loan_disbursed_date_second_tranche',
    'secondtranchedate': 'loan_disbursed_date_second_tranche',
    '2ndtranchedate': 'loan_disbursed_date_second_tranche',
    'loandisbursedamountsecondtranche': 'loan_disbursed_amount_second_tranche',
    'secondtrancheamount': 'loan_disbursed_amount_second_tranche',
    '2ndtrancheamount': 'loan_disbursed_amount_second_tranche',
    'loansecondtranchedisbursalutr': 'loan_second_tranche_disbursal_utr',
    'secondtrancheutr': 'loan_second_tranche_disbursal_utr',
    'feasibilityappliedkw': 'feasibility_applied_kw',
    'feasibilityapproveddate': 'feasibility_approved_date',
    'feasibilityreturneddate': 'feasibility_returned_date',
    'feasibilityreturnremarks': 'feasibility_return_remarks',
    'solarplantinstallationdate': 'solar_plant_installation_date',
    'installedpvmodulecapacitykwp': 'installed_pv_module_capacity_kwp',
    'pvmodulemake': 'pv_module_make',
    'panelmake': 'pv_module_make',
    'modulecapacitywp': 'module_capacity_wp',
    'modulequantity': 'module_quantity',
    'panelquantity': 'module_quantity',
    'pvmoduleserialno': 'pv_module_serial_no',
    'invertercapacitykw': 'inverter_capacity_kw',
    'invertercapacity': 'inverter_capacity_kw',
    'invertermake': 'inverter_make',
    'inverterquantity': 'inverter_quantity',
    'inspectionstatus': 'inspection_status',
    'inspectiondate': 'inspection_date',
    'inspectionreturndate': 'inspection_return_date',
    'inspectionreturncomment': 'inspection_return_comment',
    'subsidyredeemdate': 'subsidy_redeem_date',
    'subsidyamount': 'subsidy_amount',
    'subsidyreturndate': 'subsidy_return_date',
    'subsidyreturnto': 'subsidy_return_to',
    'subsidyreturncomment': 'subsidy_return_comment',
    'subsidyverifieddate': 'subsidy_verified_date',
    'subsidydisburseddate': 'subsidy_disbursed_date',
    'lastcomment': 'last_comment',
    'lastcommentdate': 'last_comment_date',
    'noofhouserwa': 'no_of_house_rwa'
};

export default function MISUploadView({ role = 'admin' }) {
    const [uploading, setUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [flaggedItems, setFlaggedItems] = useState([]);
    const [changeLogs, setChangeLogs] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'stage_changed' | 'stage_same' | 'added' | 'flagged'
    const [selectedStageFilter, setSelectedStageFilter] = useState('all'); // 'all' | stageName
    const [searchFilter, setSearchFilter] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // Live session report after upload
    const [syncSessionReport, setSyncSessionReport] = useState(null);

    useEffect(() => {
        try {
            const cached = localStorage.getItem('watersun_last_mis_sync_report');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
                    setSyncSessionReport(parsed);
                }
            }
        } catch (e) {
            console.warn('Failed to restore cached sync session:', e);
        }
        fetchRecentSyncStats();
    }, []);

    const fetchRecentSyncStats = async () => {
        setLoadingHistory(true);
        try {
            let misData = [];
            let misCount = 0;
            try {
                const { data, count, error } = await supabase
                    .from('mis')
                    .select('*', { count: 'exact' })
                    .order('uploaded_at', { ascending: false })
                    .limit(100);
                if (!error && data) {
                    misData = data;
                    misCount = count || data.length;
                }
            } catch (e) {
                console.warn('mis table query error:', e);
            }

            let loadedLogs = [];
            try {
                const { data: logData, error: logError } = await supabase
                    .from('mis_change_log')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(200);
                if (!logError && logData && logData.length > 0) {
                    loadedLogs = logData;
                } else {
                    // Fallback to activity_log where MIS syncs and customer creations are logged
                    const { data: actData } = await supabase
                        .from('activity_log')
                        .select('*')
                        .in('action', ['mis_sync', 'customer_created'])
                        .order('created_at', { ascending: false })
                        .limit(200);

                    if (actData && actData.length > 0) {
                        loadedLogs = actData.map(r => {
                            const match = r.message?.match(/MIS Sync:\s*([^\s(]+)(?:\s*\(([^)]+)\))?/i);
                            const cNo = match ? match[1] : '';
                            const name = match ? match[2] : (r.message || 'Consumer');
                            const diffs = (r.new_value || '').split('; ').filter(Boolean).map(part => {
                                const [f, vals] = part.split(': ');
                                const [old_val, new_val] = (vals || '').split(' → ');
                                return { field: f || 'Diff', old_val: old_val || 'None', new_val: new_val || vals || '' };
                            });

                            return {
                                id: r.id,
                                consumer_number: cNo,
                                consumer_name: name,
                                application_number: null,
                                action: r.action === 'customer_created' ? 'INSERT' : 'UPDATE',
                                changed_fields: diffs,
                                summary: r.new_value || r.message,
                                sync_source: 'MIS_PORTAL_SYNC',
                                created_at: r.created_at
                            };
                        });
                    }
                }
            } catch (e) {
                console.warn('Failed to query logs:', e);
            }
            setChangeLogs(loadedLogs);

            if (misData.length > 0) {
                const stageCounts = {};
                const flags = [];
                misData.forEach(row => {
                    const st = row.current_status_of_application || 'Unknown';
                    stageCounts[st] = (stageCounts[st] || 0) + 1;
                    
                    if (row.inspection_return_comment || row.feasibility_return_remarks || (row.last_comment && row.last_comment.toLowerCase().includes('reject'))) {
                        flags.push(row);
                    }
                });

                setUploadStats({
                    totalRecords: misCount,
                    stageCounts,
                    lastSyncDate: new Date(misData[0].uploaded_at).toLocaleString()
                });
                setFlaggedItems(flags);
            } else {
                setUploadStats({
                    totalRecords: 0,
                    stageCounts: {},
                    lastSyncDate: 'No sync recorded'
                });
            }
        } catch (err) {
            console.error('Failed to fetch MIS sync history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Clean date & numeric helpers
    const parseToISODate = (val) => {
        if (!val) return null;
        if (val instanceof Date && !isNaN(val)) {
            return val.toISOString().split('T')[0];
        }
        const str = String(val).trim();
        if (!str || ['null', 'none', '-', '/', '#n/a', 'na', 'undefined'].includes(str.toLowerCase())) return null;
        
        // Excel serial date number
        if (!isNaN(Number(str)) && Number(str) > 20000 && Number(str) < 70000) {
            const d = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
            if (!isNaN(d)) return d.toISOString().split('T')[0];
        }
        
        // DD/MM/YYYY or DD-MM-YYYY
        const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
        if (dmy) {
            return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
        }
        // YYYY/MM/DD or YYYY-MM-DD
        const ymd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
        if (ymd) {
            return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
        }
        const parsed = new Date(str);
        if (!isNaN(parsed) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
            return parsed.toISOString().split('T')[0];
        }
        return null;
    };

    const parseNum = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const n = parseFloat(String(val).replace(/,/g, '').trim());
        return isNaN(n) ? null : n;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setErrorMsg(null);
        setUploadProgress(5);

        try {
            // Read file via XLSX array buffer (works for .xlsx, .xls, .csv, .tsv, etc.)
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
            
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error("No worksheets found in the uploaded file.");
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to 2D array
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
            
            if (!rawRows || rawRows.length < 2) {
                throw new Error("The uploaded file is empty or missing data rows.");
            }

            // Inspect header row to determine column mapping
            const headerRow = rawRows[0].map(h => String(h || '').trim());
            const colIndexMap = {};
            let hasMappedHeaders = false;

            headerRow.forEach((rawH, idx) => {
                const norm = rawH.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (HEADER_SYNONYMS[norm]) {
                    colIndexMap[HEADER_SYNONYMS[norm]] = idx;
                    hasMappedHeaders = true;
                }
            });

            const rowsToInsert = [];
            for (let r = 1; r < rawRows.length; r++) {
                const rowArr = rawRows[r];
                if (!rowArr || rowArr.length === 0) continue;

                let rowObj = {};
                if (hasMappedHeaders && (colIndexMap['consumer_number'] !== undefined || colIndexMap['application_number'] !== undefined)) {
                    STANDARD_HEADERS.forEach(key => {
                        const idx = colIndexMap[key];
                        let val = idx !== undefined && rowArr[idx] !== undefined ? String(rowArr[idx]).trim() : null;
                        if (val && ['/', '-', '#n/a', 'null', 'nan', ''].includes(val.toLowerCase())) {
                            val = null;
                        }
                        rowObj[key] = val;
                    });
                } else {
                    STANDARD_HEADERS.forEach((key, idx) => {
                        let val = rowArr[idx] !== undefined ? String(rowArr[idx]).trim() : null;
                        if (val && ['/', '-', '#n/a', 'null', 'nan', ''].includes(val.toLowerCase())) {
                            val = null;
                        }
                        rowObj[key] = val;
                    });
                }

                const cNo = (rowObj.consumer_number || '').replace(/["']/g, '').trim();
                const appNo = (rowObj.application_number || '').replace(/["']/g, '').trim();
                if ((cNo && !['/', '-', '#N/A', ''].includes(cNo)) || (appNo && !['/', '-', '#N/A', ''].includes(appNo))) {
                    rowObj.consumer_number = cNo || null;
                    rowObj.application_number = appNo || null;
                    rowsToInsert.push(rowObj);
                }
            }

            if (rowsToInsert.length === 0) {
                throw new Error("No valid consumer or application records found in the uploaded file.");
            }

            setUploadProgress(20);

            // 1. Audit write to `mis` table
            try {
                const chunkSize = 100;
                const totalChunks = Math.ceil(rowsToInsert.length / chunkSize);
                for (let c = 0; c < totalChunks; c++) {
                    const chunk = rowsToInsert.slice(c * chunkSize, (c + 1) * chunkSize);
                    await supabase.from('mis').insert(chunk);
                }
            } catch (misErr) {
                console.warn("MIS table audit write skipped:", misErr);
            }

            setUploadProgress(40);

            // 2. Fetch existing CRM records
            const consumerNos = rowsToInsert.map(r => (r.consumer_number || '').trim()).filter(Boolean);
            let existingAdminRows = [];
            for (let i = 0; i < consumerNos.length; i += 200) {
                const batch = consumerNos.slice(i, i + 200);
                const { data } = await supabase
                    .from('admin')
                    .select('id, consumer_number, consumer_name, application_number, status, portal_status, first_tranche_date, second_tranche_date, panel_brand, panel_wattage_wp, panel_quantity, inverter_brand, inverter_capacity_kw')
                    .in('consumer_number', batch);
                if (data) existingAdminRows = existingAdminRows.concat(data);
            }

            const existingMap = new Map();
            existingAdminRows.forEach(r => {
                if (r.consumer_number) existingMap.set(r.consumer_number.trim(), r);
            });

            const now = new Date().toISOString();
            const changeLogEntries = [];
            const activityLogEntries = [];
            const sessionItems = [];

            let changedCount = 0;
            let unchangedCount = 0;
            let addedCount = 0;
            let flaggedCount = 0;
            let stageChangedCount = 0;
            let stageSameCount = 0;

            for (let i = 0; i < rowsToInsert.length; i++) {
                const row = rowsToInsert[i];
                const cNo = (row.consumer_number || '').trim();
                const existing = existingMap.get(cNo);

                const isFlagged = Boolean(
                    row.inspection_return_comment || 
                    row.feasibility_return_remarks || 
                    (row.last_comment && row.last_comment.toLowerCase().includes('reject'))
                );
                const flaggedNote = row.inspection_return_comment 
                    ? `Inspection: ${row.inspection_return_comment}`
                    : (row.feasibility_return_remarks ? `Feasibility: ${row.feasibility_return_remarks}` : row.last_comment);

                if (isFlagged) {
                    flaggedCount++;
                }

                if (existing) {
                    // Located in CRM! Check for changes
                    const oldStatus = existing.portal_status || existing.status || 'Registration';
                    const newStatus = row.current_status_of_application || oldStatus;
                    const newAppNo = row.application_number || existing.application_number;
                    const newT1Date = parseToISODate(row.loan_disbursed_date_first_tranche);
                    const newT2Date = parseToISODate(row.loan_disbursed_date_second_tranche);
                    const newPBrand = row.pv_module_make || existing.panel_brand;
                    const newPWatt = parseNum(row.module_capacity_wp);
                    const newPQty = parseNum(row.module_quantity);
                    const newIBrand = row.inverter_make || existing.inverter_brand;
                    const newICap = parseNum(row.inverter_capacity_kw);

                    const isStageChanged = Boolean(newStatus && newStatus !== oldStatus);
                    if (isStageChanged) {
                        stageChangedCount++;
                    } else {
                        stageSameCount++;
                    }

                    // Compute Diffs
                    const diffs = [];
                    if (isStageChanged) {
                        diffs.push({ field: 'Stage Status', old_val: oldStatus, new_val: newStatus });
                    }
                    if (newAppNo && newAppNo !== existing.application_number) {
                        diffs.push({ field: 'Application No', old_val: existing.application_number || 'None', new_val: newAppNo });
                    }
                    if (newT1Date && newT1Date !== existing.first_tranche_date) {
                        diffs.push({ field: '1st Tranche Date', old_val: existing.first_tranche_date || 'None', new_val: newT1Date });
                    }
                    if (newT2Date && newT2Date !== existing.second_tranche_date) {
                        diffs.push({ field: '2nd Tranche Date', old_val: existing.second_tranche_date || 'None', new_val: newT2Date });
                    }
                    if (newPBrand && newPBrand !== existing.panel_brand) {
                        diffs.push({ field: 'Panel Brand', old_val: existing.panel_brand || 'None', new_val: newPBrand });
                    }
                    if (newPWatt && Number(newPWatt) !== Number(existing.panel_wattage_wp)) {
                        diffs.push({ field: 'Panel Wattage', old_val: existing.panel_wattage_wp ? `${existing.panel_wattage_wp} Wp` : 'None', new_val: `${newPWatt} Wp` });
                    }
                    if (newPQty && Number(newPQty) !== Number(existing.panel_quantity)) {
                        diffs.push({ field: 'Panel Quantity', old_val: existing.panel_quantity ? String(existing.panel_quantity) : 'None', new_val: String(newPQty) });
                    }
                    if (newIBrand && newIBrand !== existing.inverter_brand) {
                        diffs.push({ field: 'Inverter Brand', old_val: existing.inverter_brand || 'None', new_val: newIBrand });
                    }
                    if (newICap && Number(newICap) !== Number(existing.inverter_capacity_kw)) {
                        diffs.push({ field: 'Inverter Capacity', old_val: existing.inverter_capacity_kw ? `${existing.inverter_capacity_kw} kW` : 'None', new_val: `${newICap} kW` });
                    }
                    if (row.loan_status && row.loan_status !== existing.loan_status) {
                        diffs.push({ field: 'Loan Status', old_val: existing.loan_status || 'None', new_val: row.loan_status });
                    }

                    if (diffs.length > 0) {
                        // CHANGED
                        changedCount++;
                        const updatePayload = {
                            portal_status: newStatus,
                            status: newStatus,
                            application_number: newAppNo,
                            discom_name: row.discom_name || undefined,
                            sub_division: row.sub_division_name || undefined,
                            division: row.division_name || undefined,
                            circle: row.circle_name || undefined,
                            first_tranche_date: newT1Date,
                            second_tranche_date: newT2Date,
                            panel_brand: newPBrand,
                            panel_wattage_wp: newPWatt,
                            panel_quantity: newPQty,
                            inverter_brand: newIBrand,
                            inverter_capacity_kw: newICap,
                            loan_status: row.loan_status || undefined,
                            loan_disbursed_amount: parseNum(row.loan_disbursed_amount_first_tranche),
                            updated_at: now,
                        };

                        Object.keys(updatePayload).forEach(k => {
                            if (updatePayload[k] === undefined) delete updatePayload[k];
                        });

                        await supabase.from('admin').update(updatePayload).eq('id', existing.id);

                        const summaryStr = diffs.map(d => `${d.field}: ${d.old_val} → ${d.new_val}`).join('; ');
                        
                        changeLogEntries.push({
                            consumer_number: cNo,
                            consumer_name: existing.consumer_name || row.consumer_name,
                            application_number: newAppNo,
                            action: 'UPDATE',
                            changed_fields: diffs,
                            summary: summaryStr,
                            sync_source: 'UI_UPLOAD',
                            created_at: now
                        });

                        activityLogEntries.push({
                            customer_id: existing.id,
                            action: 'mis_sync',
                            message: `MIS Sync: ${cNo} (${existing.consumer_name || 'Consumer'}) updated`,
                            new_value: summaryStr,
                            created_at: now
                        });

                        sessionItems.push({
                            id: existing.id || `changed-${i}`,
                            consumer_number: cNo,
                            consumer_name: existing.consumer_name || row.consumer_name || 'Consumer',
                            application_number: newAppNo,
                            type: 'CHANGED',
                            old_stage: oldStatus,
                            current_stage: newStatus,
                            stage_changed: isStageChanged,
                            diffs: diffs,
                            summary: summaryStr,
                            is_flagged: isFlagged,
                            flagged_note: flaggedNote,
                            discom_name: row.discom_name || existing.discom_name,
                            created_at: now
                        });
                    } else {
                        // UNCHANGED (Located in CRM and verified)
                        unchangedCount++;
                        sessionItems.push({
                            id: existing.id || `unchanged-${i}`,
                            consumer_number: cNo,
                            consumer_name: existing.consumer_name || row.consumer_name || 'Consumer',
                            application_number: existing.application_number || row.application_number,
                            type: 'UNCHANGED',
                            old_stage: oldStatus,
                            current_stage: oldStatus,
                            stage_changed: false,
                            diffs: [],
                            summary: `Located in CRM • Current Stage: ${oldStatus} • All 12 sync fields match portal data`,
                            is_flagged: isFlagged,
                            flagged_note: flaggedNote,
                            discom_name: row.discom_name,
                            created_at: now
                        });
                    }
                } else {
                    // NEW CUSTOMER (Not found in CRM, add them!)
                    addedCount++;
                    const targetStage = row.current_status_of_application || 'Registration';
                    stageSameCount++; // New customer starts at portal stage

                    const newAdminRecord = {
                        consumer_number: cNo,
                        application_number: row.application_number || null,
                        consumer_name: row.consumer_name || 'Consumer',
                        mobile_no: row.mobile_no_of_consumer || null,
                        email: row.email_of_consumer || null,
                        address: row.consumer_address || null,
                        district: row.district_name || null,
                        circle: row.circle_name || null,
                        division: row.division_name || null,
                        sub_division: row.sub_division_name || null,
                        discom_name: row.discom_name || null,
                        status: targetStage,
                        portal_status: targetStage,
                        proposed_capacity_kw: parseNum(row.proposed_pv_capacity_kwp) || parseNum(row.sanction_load_kwp) || null,
                        first_tranche_date: parseToISODate(row.loan_disbursed_date_first_tranche),
                        second_tranche_date: parseToISODate(row.loan_disbursed_date_second_tranche),
                        panel_brand: row.pv_module_make || null,
                        panel_wattage_wp: parseNum(row.module_capacity_wp),
                        panel_quantity: parseNum(row.module_quantity),
                        inverter_brand: row.inverter_make || null,
                        inverter_capacity_kw: parseNum(row.inverter_capacity_kw),
                        loan_status: row.loan_status || null,
                        loan_disbursed_amount: parseNum(row.loan_disbursed_amount_first_tranche),
                        remarks: flaggedNote || 'Imported via MIS Portal Sync',
                        sources: 'MIS_IMPORT',
                        created_at: now,
                        updated_at: now
                    };

                    const { data: insData, error: insErr } = await supabase
                        .from('admin')
                        .insert([newAdminRecord])
                        .select('id');

                    const newId = insData?.[0]?.id || `added-${i}`;
                    const addSummary = `New consumer created in CRM (Stage: ${targetStage}, Capacity: ${row.proposed_pv_capacity_kwp || 'N/A'} kW)`;

                    changeLogEntries.push({
                        consumer_number: cNo,
                        consumer_name: row.consumer_name || 'Consumer',
                        application_number: row.application_number,
                        action: 'INSERT',
                        changed_fields: [{ field: 'Record', old_val: 'None (New)', new_val: 'Added to CRM' }],
                        summary: addSummary,
                        sync_source: 'UI_UPLOAD',
                        created_at: now
                    });

                    if (newId && typeof newId === 'string' && newId.length > 20) {
                        activityLogEntries.push({
                            customer_id: newId,
                            action: 'customer_created',
                            message: `New customer ${cNo} created via MIS Sync`,
                            new_value: addSummary,
                            created_at: now
                        });
                    }

                    sessionItems.push({
                        id: newId,
                        consumer_number: cNo,
                        consumer_name: row.consumer_name || 'Consumer',
                        application_number: row.application_number,
                        type: 'ADDED',
                        old_stage: null,
                        current_stage: targetStage,
                        stage_changed: false,
                        diffs: [{ field: 'New Record', old_val: 'None', new_val: 'Created in CRM' }],
                        summary: addSummary,
                        is_flagged: isFlagged,
                        flagged_note: flaggedNote,
                        discom_name: row.discom_name,
                        created_at: now
                    });
                }

                if (i % 40 === 0) {
                    const pct = 40 + Math.round((i / rowsToInsert.length) * 55);
                    setUploadProgress(pct);
                }
            }

            // Save change logs & activity logs
            if (changeLogEntries.length > 0) {
                try {
                    await supabase.from('mis_change_log').insert(changeLogEntries);
                } catch (cErr) {
                    console.warn('mis_change_log insert error:', cErr);
                }
            }

            if (activityLogEntries.length > 0) {
                try {
                    await supabase.from('activity_log').insert(activityLogEntries);
                } catch (aErr) {
                    console.warn('activity_log insert error:', aErr);
                }
            }

            const sessionReport = {
                fileName: file.name,
                processedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                totalRows: rowsToInsert.length,
                changedCount,
                unchangedCount,
                addedCount,
                flaggedCount,
                stageChangedCount,
                stageSameCount,
                items: sessionItems
            };

            try {
                localStorage.setItem('watersun_last_mis_sync_report', JSON.stringify(sessionReport));
            } catch (storageErr) {
                console.warn('Failed to save sync report to localStorage:', storageErr);
            }

            setSyncSessionReport(sessionReport);
            setActiveFilter('all');
            setSelectedStageFilter('all');
            setUploadProgress(100);
            await fetchRecentSyncStats();
        } catch (err) {
            console.error("Upload failed:", err);
            setErrorMsg(err.message || "Failed to upload and process MIS sheet.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (e.target) e.target.value = '';
        }
    };

    // Combine active items from current session report or history
    const getDisplayItems = () => {
        if (syncSessionReport && syncSessionReport.items) {
            return syncSessionReport.items;
        }
        
        // Fallback to historical change logs formatted as items
        return changeLogs.map(log => {
            const diffsArr = Array.isArray(log.changed_fields) ? log.changed_fields : [];
            const stageDiff = diffsArr.find(d => (d.field || '').toLowerCase().includes('stage') || (d.field || '').toLowerCase() === 'status');
            const isStageChanged = Boolean(stageDiff);
            const oldStage = stageDiff ? stageDiff.old_val : null;
            const curStage = stageDiff ? stageDiff.new_val : 'Synced Record';

            return {
                id: log.id,
                consumer_number: log.consumer_number,
                consumer_name: log.consumer_name,
                application_number: log.application_number,
                type: log.action === 'INSERT' ? 'ADDED' : (log.action === 'VERIFIED' ? 'UNCHANGED' : 'CHANGED'),
                old_stage: oldStage,
                current_stage: curStage,
                stage_changed: isStageChanged,
                diffs: diffsArr,
                summary: log.summary,
                is_flagged: false,
                flagged_note: null,
                created_at: log.created_at
            };
        });
    };

    const allItems = getDisplayItems();

    // Dynamically calculate unique stages
    const uniqueStages = Array.from(
        new Set(
            allItems
                .flatMap(i => [i.current_stage, i.old_stage])
                .filter(s => s && s !== 'Synced Record' && s !== 'None' && s !== 'Unknown')
        )
    ).sort();

    // Filter Pipeline
    const displayList = allItems.filter(item => {
        // 1. Metric Card Filter
        if (activeFilter === 'stage_changed' && !item.stage_changed) return false;
        if (activeFilter === 'stage_same' && (item.stage_changed || item.type === 'ADDED')) return false;
        if (activeFilter === 'added' && item.type !== 'ADDED') return false;
        if (activeFilter === 'flagged' && !item.is_flagged) return false;

        // 2. Specific Stage Name Filter
        if (selectedStageFilter !== 'all') {
            const matchCurrent = item.current_stage === selectedStageFilter;
            const matchOld = item.old_stage === selectedStageFilter;
            if (!matchCurrent && !matchOld) return false;
        }

        // 3. Search Filter
        if (searchFilter.trim()) {
            const q = searchFilter.toLowerCase();
            const matches = (
                (item.consumer_number || '').toLowerCase().includes(q) ||
                (item.consumer_name || '').toLowerCase().includes(q) ||
                (item.application_number || '').toLowerCase().includes(q) ||
                (item.summary || '').toLowerCase().includes(q) ||
                (item.current_stage || '').toLowerCase().includes(q) ||
                (item.old_stage || '').toLowerCase().includes(q)
            );
            if (!matches) return false;
        }

        return true;
    });

    // Counts for stat cards & filters
    const counts = {
        total: allItems.length,
        stageChanged: allItems.filter(i => i.stage_changed).length,
        stageSame: allItems.filter(i => !i.stage_changed && i.type !== 'ADDED').length,
        added: allItems.filter(i => i.type === 'ADDED').length,
        flagged: allItems.filter(i => i.is_flagged).length,
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-xs">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-stone-900">
                                PM Surya Ghar — MIS Automated Portal Sync
                            </h1>
                            <p className="text-xs text-stone-500">
                                Upload National Portal MIS export sheets to audit records, track stage changes, and sync CRM data.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={fetchRecentSyncStats} 
                        disabled={loadingHistory}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                        Refresh Sync Status
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs shadow-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Sync Error:</span> {errorMsg}
                    </div>
                </div>
            )}

            {/* Modern Upload Box */}
            <div className="bg-gradient-to-b from-amber-50/50 via-white to-white border-2 border-dashed border-amber-300/80 hover:border-amber-500 rounded-2xl p-8 text-center transition-all duration-200 shadow-xs group">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition-transform duration-200">
                        <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-stone-900">Upload PM Surya Ghar MIS Export</h3>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                            Drop or select your portal sheet. Supports all export extensions:
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            {['.xlsx', '.xls', '.csv', '.tsv'].map(ext => (
                                <span key={ext} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md font-mono text-[11px] font-bold border border-stone-200">
                                    {ext}
                                </span>
                            ))}
                        </div>
                    </div>

                    {uploading ? (
                        <div className="space-y-2 py-2 max-w-xs mx-auto">
                            <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden border border-stone-200">
                                <div 
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs font-bold text-amber-700 animate-pulse">
                                Processing & Syncing Records: {uploadProgress}%
                            </p>
                        </div>
                    ) : (
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all">
                            <FileSpreadsheet className="w-4 h-4" />
                            Choose File to Process
                            <input 
                                type="file" 
                                accept=".csv, .xlsx, .xls, .tsv, .txt, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                                onChange={handleFileUpload} 
                                className="hidden" 
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* Live Sync Report Highlight Banner (shown after upload) */}
            {syncSessionReport && (
                <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-5 md:p-6 rounded-2xl shadow-md border border-stone-700/60">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <Sparkles size={11} /> Sync Finished
                                </span>
                                <span className="text-xs text-stone-300 font-mono font-medium">
                                    File: {syncSessionReport.fileName}
                                </span>
                                <span className="text-xs text-stone-400">
                                    • {syncSessionReport.processedAt}
                                </span>
                            </div>
                            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                                Successfully Processed {syncSessionReport.totalRows} Consumer Records
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                            <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                                🔄 {syncSessionReport.stageChangedCount} Stage Changed
                            </span>
                            <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                                ⏸️ {syncSessionReport.stageSameCount} Stage Untouched
                            </span>
                            <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl">
                                ➕ {syncSessionReport.addedCount} New Customers Added
                            </span>
                            {syncSessionReport.flaggedCount > 0 && (
                                <span className="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl">
                                    ⚠️ {syncSessionReport.flaggedCount} Flagged
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Clickable Top Metric Cards (Directly controls active filtering) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Processed */}
                <div 
                    onClick={() => setActiveFilter('all')}
                    className={`relative p-5 rounded-2xl transition-all duration-150 cursor-pointer shadow-xs ${
                        activeFilter === 'all'
                            ? 'bg-stone-900 text-white shadow-md ring-4 ring-stone-200'
                            : 'bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm text-stone-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                            activeFilter === 'all' ? 'text-stone-300' : 'text-stone-500'
                        }`}>
                            Total Processed
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            activeFilter === 'all' ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-600'
                        }`}>
                            <Database size={15} />
                        </div>
                    </div>
                    <div className="text-3xl font-black mt-3">
                        {counts.total}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${
                        activeFilter === 'all' ? 'text-stone-300' : 'text-stone-400'
                    }`}>
                        All records verified
                    </div>
                </div>

                {/* 2. Stage Changed */}
                <div 
                    onClick={() => setActiveFilter(activeFilter === 'stage_changed' ? 'all' : 'stage_changed')}
                    className={`relative p-5 rounded-2xl transition-all duration-150 cursor-pointer shadow-xs ${
                        activeFilter === 'stage_changed'
                            ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-200'
                            : 'bg-gradient-to-br from-amber-50/60 to-white border border-amber-200 hover:border-amber-300 hover:shadow-sm text-stone-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                            activeFilter === 'stage_changed' ? 'text-amber-100' : 'text-amber-700'
                        }`}>
                            Stage Changed
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            activeFilter === 'stage_changed' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
                        }`}>
                            <Diff size={15} />
                        </div>
                    </div>
                    <div className={`text-3xl font-black mt-3 ${activeFilter === 'stage_changed' ? 'text-white' : 'text-amber-700'}`}>
                        {counts.stageChanged}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${activeFilter === 'stage_changed' ? 'text-amber-100' : 'text-amber-800/70'}`}>
                        Transitioned to new stage
                    </div>
                </div>

                {/* 3. Stage Same */}
                <div 
                    onClick={() => setActiveFilter(activeFilter === 'stage_same' ? 'all' : 'stage_same')}
                    className={`relative p-5 rounded-2xl transition-all duration-150 cursor-pointer shadow-xs ${
                        activeFilter === 'stage_same'
                            ? 'bg-emerald-700 text-white shadow-md ring-4 ring-emerald-200'
                            : 'bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 hover:border-emerald-300 hover:shadow-sm text-stone-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                            activeFilter === 'stage_same' ? 'text-emerald-100' : 'text-emerald-700'
                        }`}>
                            Stage Same
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            activeFilter === 'stage_same' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                            <CheckCircle2 size={15} />
                        </div>
                    </div>
                    <div className={`text-3xl font-black mt-3 ${activeFilter === 'stage_same' ? 'text-white' : 'text-emerald-700'}`}>
                        {counts.stageSame}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${activeFilter === 'stage_same' ? 'text-emerald-100' : 'text-emerald-800/70'}`}>
                        Stage remained untouched
                    </div>
                </div>

                {/* 4. New Customers */}
                <div 
                    onClick={() => setActiveFilter(activeFilter === 'added' ? 'all' : 'added')}
                    className={`relative p-5 rounded-2xl transition-all duration-150 cursor-pointer shadow-xs ${
                        activeFilter === 'added'
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-200'
                            : 'bg-gradient-to-br from-blue-50/60 to-white border border-blue-200 hover:border-blue-300 hover:shadow-sm text-stone-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                            activeFilter === 'added' ? 'text-blue-100' : 'text-blue-700'
                        }`}>
                            New Customers
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            activeFilter === 'added' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
                        }`}>
                            <UserPlus size={15} />
                        </div>
                    </div>
                    <div className={`text-3xl font-black mt-3 ${activeFilter === 'added' ? 'text-white' : 'text-blue-700'}`}>
                        {counts.added}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${activeFilter === 'added' ? 'text-blue-100' : 'text-blue-800/70'}`}>
                        Created into CRM database
                    </div>
                </div>
            </div>

            {/* Customer Records Feed Container */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                {/* Single Consolidated Action Bar */}
                <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Active Filter Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-stone-500">Active View:</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-stone-900 text-white shadow-xs">
                            {activeFilter === 'all' && `All Records (${counts.total})`}
                            {activeFilter === 'stage_changed' && `🔄 Stage Changed (${counts.stageChanged})`}
                            {activeFilter === 'stage_same' && `⏸️ Stage Same (${counts.stageSame})`}
                            {activeFilter === 'added' && `➕ New Customers (${counts.added})`}
                            {activeFilter === 'flagged' && `⚠️ Flagged Queries (${counts.flagged})`}
                        </span>

                        {activeFilter !== 'all' && (
                            <button
                                type="button"
                                onClick={() => setActiveFilter('all')}
                                className="text-xs text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer ml-1"
                            >
                                Reset to All
                            </button>
                        )}

                        {counts.flagged > 0 && (
                            <button
                                type="button"
                                onClick={() => setActiveFilter(activeFilter === 'flagged' ? 'all' : 'flagged')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ml-2 ${
                                    activeFilter === 'flagged'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                                }`}
                            >
                                <AlertCircle size={13} /> Flagged Queries ({counts.flagged})
                            </button>
                        )}
                    </div>

                    {/* Right: Search & Specific Stage Dropdown */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="relative">
                            <Search size={14} className="absolute left-3.5 top-2.5 text-stone-400" />
                            <input
                                type="text"
                                value={searchFilter}
                                onChange={e => setSearchFilter(e.target.value)}
                                placeholder="Search consumer, stage, app #..."
                                className="pl-9 pr-7 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 w-56 md:w-64 transition-all"
                            />
                            {searchFilter && (
                                <button 
                                    onClick={() => setSearchFilter('')}
                                    className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 text-xs px-1"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {uniqueStages.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <select
                                    value={selectedStageFilter}
                                    onChange={e => setSelectedStageFilter(e.target.value)}
                                    className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer shadow-2xs"
                                >
                                    <option value="all">All Stages ({allItems.length})</option>
                                    {uniqueStages.map(st => {
                                        const count = allItems.filter(i => i.current_stage === st || i.old_stage === st).length;
                                        return (
                                            <option key={st} value={st}>
                                                {st} ({count})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-stone-100 max-h-[520px] overflow-y-auto">
                    {displayList.length > 0 ? (
                        displayList.map((item, idx) => (
                            <div key={item.id || idx} className="p-4 md:p-5 hover:bg-stone-50/70 transition-colors space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        {/* Status Type Badge */}
                                        {item.type === 'CHANGED' && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg">
                                                <Diff size={11} /> Changed
                                            </span>
                                        )}
                                        {item.type === 'UNCHANGED' && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                                <CheckCircle2 size={11} className="text-emerald-600" /> Located & Verified
                                            </span>
                                        )}
                                        {item.type === 'ADDED' && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg">
                                                <UserPlus size={11} className="text-blue-600" /> New Customer
                                            </span>
                                        )}

                                        <span className="font-bold text-stone-900 text-sm">{item.consumer_name || 'Consumer'}</span>
                                        <span className="text-[11px] font-mono bg-stone-100 px-2.5 py-0.5 rounded-md text-stone-700 font-bold border border-stone-200">
                                            #{item.consumer_number}
                                        </span>
                                        {item.application_number && (
                                            <span className="text-[11px] font-mono bg-stone-50 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200">
                                                App: {item.application_number}
                                            </span>
                                        )}

                                        {/* Dedicated Stage Transition / State Pill */}
                                        {item.stage_changed ? (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-amber-100/80 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-md shadow-2xs">
                                                <span>🔄 Stage Changed:</span>
                                                <span className="line-through text-amber-700 font-medium">{item.old_stage || 'Registration'}</span>
                                                <ArrowRight size={11} className="text-amber-700 shrink-0" />
                                                <span className="text-amber-950 font-black">{item.current_stage}</span>
                                            </span>
                                        ) : item.type === 'ADDED' ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-md">
                                                ➕ Stage: {item.current_stage} (Initial)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                                                ⏸️ Stage: {item.current_stage} (Untouched)
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-stone-400 font-medium shrink-0">
                                        {new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Summary & Diffs */}
                                <div className="text-xs text-stone-600">
                                    {item.type === 'UNCHANGED' ? (
                                        <div className="flex items-center gap-2 text-stone-500 text-xs py-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                            {item.summary}
                                        </div>
                                    ) : item.type === 'ADDED' ? (
                                        <div className="flex items-center gap-2 text-blue-700 text-xs py-0.5 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                            {item.summary}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {Array.isArray(item.diffs) && item.diffs.map((diff, dIdx) => (
                                                <div key={dIdx} className="inline-flex items-center gap-1.5 text-xs bg-amber-50/70 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                    <span className="font-bold text-stone-500 uppercase text-[10px] tracking-wide">{diff.field || 'Field'}:</span>
                                                    <span className="line-through text-stone-400 font-medium">{diff.old_val || 'None'}</span>
                                                    <ArrowRight size={11} className="text-amber-500 shrink-0" />
                                                    <span className="font-bold text-amber-950 bg-amber-100/90 px-1.5 py-0.2 rounded">{diff.new_val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Flagged Query Notice if present */}
                                {item.is_flagged && item.flagged_note && (
                                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                        <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                                        <span><strong>Portal Query / Note:</strong> {item.flagged_note}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-stone-400 text-xs space-y-1.5">
                            <FileSpreadsheet className="w-8 h-8 mx-auto text-stone-300" />
                            <p className="font-bold text-stone-600 text-sm">No records found matching current stage filters</p>
                            <p className="text-stone-400">Adjust your stage filter or search criteria to view records.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
