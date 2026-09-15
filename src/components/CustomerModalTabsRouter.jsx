import CustomerSourceFields from './CustomerSourceFields';
import HistoryTab from './modal-tabs/HistoryTab';

export default function CustomerModalTabsRouter(props) {
    if (props.activeTab === 'logs') return <HistoryTab {...props} />;
    return <CustomerSourceFields {...props} />;
}
