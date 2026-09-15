import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { OPERATION_CATEGORIES } from '../utils/operationNames';

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
                const next = [];
                for (let start = 0; ; start += 500) {
                    const { data, error } = await supabase.from('metadata').select('id,category,label').in('category', OPERATION_CATEGORIES).order('id').range(start, start + 499);
                    if (error) throw error;
                    next.push(...(data || []));
                    if (!data || data.length < 500) break;
                }
                if (!cancelled) setRows(next);
            } catch (err) { if (!cancelled) setError(err.message); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [enabled, revision]);
    return { rows, setRows, loading, error, refresh: () => setRevision(value => value + 1) };
}
