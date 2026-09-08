import React from 'react';
import RegistrationTab from './modal-tabs/RegistrationTab';
import PlantInstallationTab from './modal-tabs/PlantInstallationTab';
import SubsidyClaimTab from './modal-tabs/SubsidyClaimTab';
import HistoryTab from './modal-tabs/HistoryTab';

export default function CustomerModalTabsRouter(props) {
    const { activeTab } = props;
    const tab = String(activeTab || '').trim().toLowerCase();

    // 1. Basic Info (CRM, Contacts, Grid, Channel Partner, Agreement)
    if (tab === 'basic' || tab.includes('reg') || tab.includes('vender') || tab.includes('vendor') || tab.includes('lead') || tab.includes('agreement')) {
        return <RegistrationTab {...props} />;
    }

    // 2. Technical & Plant (Solar Panels, Inverters, Capacity, Roof/Shed BOM, Milestones)
    if (tab === 'technical' || tab.includes('plant') || tab.includes('install') || tab.includes('feas') || tab.includes('inspect') || tab.includes('meter')) {
        return <PlantInstallationTab {...props} />;
    }

    // 3. Loan & Subsidy (Financing, Tranches, Project Costs, PM Surya Ghar DBT)
    if (tab === 'finance' || tab.includes('loan') || tab.includes('subsid') || tab.includes('pay') || tab.includes('claim') || tab.includes('disburs') || tab.includes('cash')) {
        return <SubsidyClaimTab {...props} />;
    }

    // 4. Remarks & Logs (Activity Log, History, Internal Notes)
    if (tab === 'logs' || tab.includes('hist') || tab.includes('note') || tab.includes('remark')) {
        return <HistoryTab {...props} />;
    }

    // Default fallback to Basic Info
    return <RegistrationTab {...props} />;
}



