import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText } from 'lucide-react';

export { TERAIYA_BOM_DEFAULT_ITEMS } from '../teraiyaBomTemplate';
import { TERAIYA_BOM_HEADINGS, resolveTeraiyaBomItems, materialDescription } from '../teraiyaBomTemplate';

export default function TeraiyaBomPrintModal({ 
    isOpen, 
    onClose, 
    customer = {},
    customItems = null,
    snapshotItems = false,
    vehicleNo = '',
    driverName = '',
    driverContact = '',
    dealerName = '',
    dispatchedBy = '',
    approvedBy = '',
    portalCharge = '',
    meterFee = '',
    materialCondition = '',
    customerSign = ''
}) {
    const printRef = useRef(null);

    if (!isOpen) return null;

    const items = (snapshotItems ? (customItems || []) : resolveTeraiyaBomItems(customItems))
        .filter(item => item.sr <= 34 || ['name', 'col1', 'col2', 'col3', 'unit', 'remark', 'detail'].some(key => String(item[key] ?? '').trim()));
    const custName = customer.consumer_name || customer.customer_name || '';
    const capacity = customer.proposed_capacity_kw || customer.system_capacity_kwp || '';

    const handlePrint = () => {
        window.print();
    };

    return createPortal(
        <div className="teraiya-print-overlay fixed inset-0 z-[9999] bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="teraiya-print-dialog bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden border border-stone-200">
                {/* Modal Header */}
                <div className="no-print bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-bold tracking-wide">
                            Teraiya Enterprise — Material Loading BOM Voucher
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Print / Save PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white text-stone-900 print-area" ref={printRef}>
                    <style>{`
                        @media print {
                            @page { size: A4 portrait; margin: 10mm; }
                            body > :not(.teraiya-print-overlay) { display: none !important; }
                            .teraiya-print-overlay, .teraiya-print-dialog {
                                position: static !important;
                                display: block !important;
                                max-height: none !important;
                                height: auto !important;
                                overflow: visible !important;
                                padding: 0 !important;
                                background: white !important;
                                border: 0 !important;
                                box-shadow: none !important;
                            }
                            .print-area { overflow: visible !important; padding: 0 !important; }
                            .no-print { display: none !important; }
                            tr { break-inside: avoid; }
                        }
                    `}</style>

                    <div className="max-w-[800px] mx-auto border-2 border-black p-4 font-sans text-xs">
                        {/* Company Header */}
                        <div className="text-center border-b-2 border-black pb-2 mb-2">
                            <h1 className="text-2xl font-black tracking-wider uppercase">TERAIYA ENTERPRISE</h1>
                        </div>

                        {/* Customer & Capacity Header */}
                        <div className="font-bold text-sm border-b-2 border-black pb-1.5 mb-2 flex justify-between items-center">
                            <span>Customer Name : {custName} {customer.consumer_number ? `(${customer.consumer_number})` : ''} {capacity ? `· ${capacity} kW` : ''}</span>
                        </div>

                        {/* Materials Table */}
                        <table className="w-full border-collapse border border-black text-[11px]">
                            <thead>
                                <tr className="border-b border-black font-bold text-center bg-stone-50">
                                    <th className="border-r border-black p-1 w-10">SR. NO.</th>
                                    <th className="border-r border-black p-1 text-left">MATERIAL DESCRIPTION</th>
                                    {TERAIYA_BOM_HEADINGS.map(name => <th key={name} className="border-r border-black p-1 w-20">{name}</th>)}
                                    <th className="border-r border-black p-1 w-14">UNIT</th>
                                    <th className="p-1 w-24">REMARK</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.sr} className="border-b border-black" style={item.sr > 34 ? { height: 20 } : undefined}>
                                        <td className="border-r border-black text-center p-0.5 font-bold">{item.sr <= 34 ? item.sr : ''}</td>
                                        <td className="border-r border-black px-1.5 py-0.5 font-medium">{materialDescription(item)}</td>
                                        <td className="border-r border-black text-center p-0.5">{item.col1}</td>
                                        <td colSpan={item.mergeLastColumns ? 2 : 1} className="border-r border-black text-center p-0.5">{item.col2}</td>
                                        {!item.mergeLastColumns && <td className="border-r border-black text-center p-0.5">{item.col3}</td>}
                                        <td className="border-r border-black text-center p-0.5 font-semibold text-[10px]">{item.unit}</td>
                                        <td className="p-0.5 text-center text-[10px]">{item.remark || ''}</td>
                                    </tr>
                                ))}
                                <tr className="border-b border-black font-semibold">
                                    <td colSpan={2} className="border-r border-black p-1 font-bold">PORTAL CHARGE</td>
                                    <td colSpan={3} className="border-r border-black p-1">{portalCharge}</td>
                                    <td className="border-r border-black text-center p-1">KW</td>
                                    <td className="p-1"></td>
                                </tr>
                                <tr className="border-b-2 border-black font-semibold">
                                    <td colSpan={2} className="border-r border-black p-1 font-bold">METER FEE</td>
                                    <td colSpan={3} className="border-r border-black p-1">{meterFee}</td>
                                    <td className="border-r border-black text-center p-1"></td>
                                    <td className="p-1"></td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Sign-off Details Box */}
                        <div className="mt-3 border-2 border-black grid grid-cols-2 divide-x-2 divide-black text-[11px] font-bold">
                            <div className="divide-y divide-black">
                                <div className="p-1.5 flex justify-between">
                                    <span>VEHICLE NO:</span>
                                    <span className="font-mono">{vehicleNo}</span>
                                </div>
                                <div className="p-1.5 flex justify-between">
                                    <span>DRIVER NAME:</span>
                                    <span>{driverName}</span>
                                </div>
                                <div className="p-1.5 flex justify-between">
                                    <span>DRIVER CONTACT:</span>
                                    <span>{driverContact}</span>
                                </div>
                                <div className="p-1.5 flex justify-between">
                                    <span>ALL MATERIAL OK , NO DAMAGE:</span>
                                    <span className="text-emerald-700">{materialCondition}</span>
                                </div>
                            </div>

                            <div className="divide-y divide-black">
                                <div className="p-1.5 flex justify-between">
                                    <span>CUSTOMER SIGN:</span>
                                    <span className="text-stone-400 font-normal">{customerSign}</span>
                                </div>
                                <div className="p-1.5 flex justify-between">
                                    <span>DEALER NAME:</span>
                                    <span>{dealerName}</span>
                                </div>
                                <div className="p-1.5 flex justify-between">
                                    <span>DISPATCHED BY:</span>
                                    <span>{dispatchedBy}</span>
                                </div>
                                <div className="p-1.5 flex justify-between">
                                    <span>APPROVED BY:</span>
                                    <span>{approvedBy}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>, document.body
    );
}
