import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { OPERATION_CATEGORIES } from '../utils/operationNames';

let cachedRows = null;
let expiresAt = 0;
let pending = null;
supabase.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') { cachedRows = null; expiresAt = 0; }
});
async function loadNames() {
    if (cachedRows && Date.now() < expiresAt) return cachedRows;
    if (pending) return pending;
    pending = (async () => {
        const next = [];
        for (let start = 0; ; start += 500) {
            const { data, error } = await supabase.from('metadata').select('id,category,label').in('category', OPERATION_CATEGORIES).order('id').range(start, start + 499);
            if (error) throw error;
            next.push(...(data || []));
            if (!data || data.length < 500) break;
        }
        cachedRows = next;
        expiresAt = Date.now() + 30000;
        return next;
    })().finally(() => { pending = null; });
    return pending;
}

export default function useOperationNames(enabled = true) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setLoading(true); setError('');
        (async () => {
            try {
                const next = await loadNames();
                if (!cancelled) setRows(next);
            } catch (err) { if (!cancelled) setError(err.message); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [enabled, revision]);
    return { rows, setRows: updater => { expiresAt = 0; setRows(updater); }, loading, error, refresh: () => { expiresAt = 0; setRevision(value => value + 1); } };
}
