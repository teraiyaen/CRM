import { useMemo } from 'react';
// ─── DashboardView.jsx ────────────────────────────────────────────────────────
// Metrics overview: project counts, financial summary, stage pipeline bar chart.
// • "Total" = all non-deleted records
// • "Live"  = non-deleted AND stage !== 'Completed'
// • "Completed" = stage === 'Completed' (non-deleted)
// Numbers use Indian locale (₹1,00,000)
// ──────────────────────────────────────────────────────────────────────────────

import { FolderOpen, Activity, CheckCircle2 } from 'lucide-react';
import { PRIMARY_STAGES } from '../constants';
import { formatINRCompact } from '../utils';

const fmtLakh = formatINRCompact;

const MetricBox = ({ label, value, sub, icon: Icon, color }) => {
    const colorMap = {
        amber:   'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        blue:    'bg-blue-50 text-blue-600',
    };
    return (
        <div className="bg-white p-6 rounded-[28px] border border-stone-100 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon size={16} />
            </div>
            <p className="text-2xl font-bold text-stone-800 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{label}</p>
        </div>
    );
};

export default function DashboardView({ metrics, loading }) {
    const {
        totalProjects = 0,
        completedCount = 0,
        liveProjects = 0,
        loanCount = 0,
        bankCount = 0,
        cashCount = 0,
        pendingPaymentCount = 0,
        stageCounts = {}
    } = metrics || {};

    // Payment Modes Percentage Breakdown
    const { loanPerc, bankPerc, cashPerc, pendingPerc } = useMemo(() => {
        if (!totalProjects) return { loanPerc: 0, bankPerc: 0, cashPerc: 0, pendingPerc: 0 };
        return {
            loanPerc: (loanCount / totalProjects) * 100,
            bankPerc: (bankCount / totalProjects) * 100,
            cashPerc: (cashCount / totalProjects) * 100,
            pendingPerc: (pendingPaymentCount / totalProjects) * 100,
        };
    }, [totalProjects, loanCount, bankCount, cashCount, pendingPaymentCount]);

    if (!metrics) return (
        <div className="p-20 text-center text-stone-400 font-medium italic animate-pulse">
            Calculating solar metrics...
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Project counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricBox label="Total Database" value={totalProjects}  icon={FolderOpen}   color="blue"    sub={`${liveProjects} active records`} />
                <MetricBox label="Live Projects"  value={liveProjects}   icon={Activity}     color="amber"   sub="Excluding Completed" />
                <MetricBox label="Completed"      value={completedCount} icon={CheckCircle2} color="emerald" sub="Fully commissioned" />
            </div>

            {/* Financial / Payment Mode Analytics */}
            <div className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Payment & Financing Breakdown</h3>
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                        {totalProjects} Total Applications
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>Loan Financed</span>
                        </div>
                        <p className="text-lg font-black text-emerald-950 mt-1">{loanCount}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">{loanPerc.toFixed(1)}% of total</p>
                    </div>

                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span>Bank / Cheque</span>
                        </div>
                        <p className="text-lg font-black text-blue-950 mt-1">{bankCount}</p>
                        <p className="text-[10px] text-blue-700 font-semibold">{bankPerc.toFixed(1)}% of total</p>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span>Cash</span>
                        </div>
                        <p className="text-lg font-black text-amber-950 mt-1">{cashCount}</p>
                        <p className="text-[10px] text-amber-700 font-semibold">{cashPerc.toFixed(1)}% of total</p>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                            <span>Pending Mode</span>
                        </div>
                        <p className="text-lg font-black text-stone-900 mt-1">{pendingPaymentCount}</p>
                        <p className="text-[10px] text-stone-500 font-semibold">{pendingPerc.toFixed(1)}% of total</p>
                    </div>
                </div>

                <div className="h-3.5 bg-stone-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                    {loanPerc > 0 && (
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${loanPerc}%` }}
                            title={`Loan: ${loanCount} (${loanPerc.toFixed(1)}%)`}
                        />
                    )}
                    {bankPerc > 0 && (
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${bankPerc}%` }}
                            title={`Bank: ${bankCount} (${bankPerc.toFixed(1)}%)`}
                        />
                    )}
                    {cashPerc > 0 && (
                        <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${cashPerc}%` }}
                            title={`Cash: ${cashCount} (${cashPerc.toFixed(1)}%)`}
                        />
                    )}
                    {pendingPerc > 0 && (
                        <div
                            className="h-full bg-stone-300 rounded-full transition-all duration-500"
                            style={{ width: `${pendingPerc}%` }}
                            title={`Pending: ${pendingPaymentCount} (${pendingPerc.toFixed(1)}%)`}
                        />
                    )}
                </div>
            </div>

            {/* Stage pipeline bar chart */}
            <div className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm">
                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-8">Operational Density (Stage Breakdown)</h3>
                <div className="space-y-5">
                    {PRIMARY_STAGES.map(stage => {
                        const count = stageCounts[stage.id] || 0;
                        const perc  = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                        return (
                            <div key={stage.id} className="group">
                                <div className="flex justify-between text-[10px] font-bold text-stone-600 mb-1.5 uppercase tracking-tight">
                                    <span className="group-hover:text-amber-600 transition-colors">{stage.label}</span>
                                    <span className="text-stone-400">{count}</span>
                                </div>
                                <div className="h-1.5 bg-stone-50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 rounded-full ${stage.id === 'COMPLETED' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                        style={{ width: `${perc}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
