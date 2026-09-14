export const documentHistoryAction = kind => `${kind}_created`;

export function documentFromActivity(log) {
    try {
        const record = JSON.parse(log.new_value);
        if (!record || !['bom', 'agreement'].includes(record.kind) || log.action !== documentHistoryAction(record.kind)) return null;
        if (record.snapshot?.version !== 1) return null;
        if (record.kind === 'bom' && (!Array.isArray(record.snapshot.items) || !record.snapshot.customer)) return null;
        if (record.kind === 'agreement' && !record.snapshot.data) return null;
        return { ...record, id: log.id, created_at: log.created_at };
    } catch { return null; }
}
