import { supabase } from '../supabase';
import { documentFromActivity } from './documentHistory';

export const AGREEMENT_SNAPSHOT_FIELDS = ['consumerName','consumerNo','address','village','taluka','district','state','executionDate','vendorName','vendorAddress'];
export function agreementSnapshot(data, hadStamp) {
    return { version: 1, data: Object.fromEntries(AGREEMENT_SNAPSHOT_FIELDS.map(key=>[key,String(data[key]||'')])), hadStamp: Boolean(hadStamp) };
}
export async function saveGeneratedDocument({ id, kind, customerId, snapshot, movements = [] }) {
    if (kind === 'agreement') {
        if (movements.length) throw new Error('Agreements cannot dispatch stock.');
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) throw new Error('Sign in first.');
        const values = agreementSnapshot(snapshot.data, snapshot.hadStamp);
        const record = { kind, customer_id: customerId || null, customer_name: values.data.consumerName || 'Manual entry', snapshot: values };
        const { data, error } = await supabase.from('activity_log').insert({
            id, user_id: auth.user.id, customer_id: customerId || null,
            action: 'agreement_created', message: `DISCOM agreement created: ${record.customer_name}`,
            new_value: JSON.stringify(record),
        }).select('id,action,new_value,created_at').single();
        if (!error) return documentFromActivity(data);
        // A retried request reuses the same log ID; never write a duplicate entry.
        if (error.code === '23505') {
            const { data: previous, error: readError } = await supabase.from('activity_log').select('id,action,new_value,created_at').eq('id', id).single();
            if (readError) throw readError;
            const existing = documentFromActivity(previous);
            if (existing?.kind === kind && existing.customer_id === record.customer_id && JSON.stringify(existing.snapshot) === JSON.stringify(values)) return existing;
            throw new Error('This request was already saved with different values. Close and start a new agreement.');
        }
        throw error;
    }
    const { data, error } = await supabase.rpc('crm_create_document', { p_id: id, p_kind: kind, p_customer_id: customerId || null, p_snapshot: snapshot, p_movements: movements });
    if (error) throw error;
    if (!data?.id) throw new Error('The document was not saved.');
    return data;
}
