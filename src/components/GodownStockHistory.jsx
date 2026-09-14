import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function GodownStockHistory({ refreshKey }) {
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let cancelled = false;
        setLoading(true); setError('');
        supabase.from('godown_transactions').select('id,type,quantity,unit,material_description,customer_name,dispatched_by,created_at,notes')
            .order('created_at', { ascending: false }).order('id').range(page * 50, page * 50 + 49)
            .then(({ data, error }) => {
                if (cancelled) return;
                if (error) { setError(error.message); setRows([]); } else setRows(data || []);
            }).catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [page, refreshKey, revision]);
    return <section className="space-y-3 rounded-xl border bg-white p-5">
        <div className="flex justify-between"><h3 className="font-bold">Stock history</h3><button disabled={loading} onClick={()=>setRevision(value=>value+1)}>Refresh</button></div>
        {loading ? <p>Loading stock history…</p> : error ? <p role="alert" className="text-red-700">{error}</p> : <>
            {rows.map(row => <div key={row.id} className="space-y-1 border-t py-3 text-sm">
                <p className="font-semibold">{row.type === 'OUT' ? 'Deducted' : 'Added'} {row.quantity} {row.unit} · {row.material_description}</p>
                <p className="text-stone-600">{row.created_at ? new Date(row.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : 'Date not recorded'}{row.customer_name ? ` · Customer: ${row.customer_name}` : ''}{row.type === 'OUT' ? ` · Created by: ${row.dispatched_by || 'Not recorded'}` : ''}</p>
                <p className="break-words text-xs text-stone-500">{row.notes?.startsWith('{') ? '' : row.notes}</p>
            </div>)}
            {!rows.length && <p className="text-sm text-stone-500">No stock movements recorded.</p>}
            <div className="flex gap-3"><button disabled={!page} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1}</span><button disabled={rows.length<50} onClick={()=>setPage(page+1)}>Next</button></div>
        </>}
    </section>;
}
