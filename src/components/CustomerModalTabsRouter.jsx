import CustomerSourceFields from './CustomerSourceFields';
import HistoryTab from './modal-tabs/HistoryTab';

export default function CustomerModalTabsRouter(props) {
    if (props.activeTab === 'logs') return <div className="space-y-5">
        <section className="rounded-2xl border bg-white p-5">
            <h3 className="text-xs font-semibold text-stone-600">Ref agent</h3>
            <p className="mt-2 text-sm text-stone-900">{props.editData?.ref_agent || '—'}</p>
        </section>
        <HistoryTab {...props} />
    </div>;
    return <CustomerSourceFields {...props} />;
}
