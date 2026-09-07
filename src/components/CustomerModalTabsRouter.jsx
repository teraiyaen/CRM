import React from 'react';
import { STAGE_IDS } from "../constants";
import RegistrationTab from './modal-tabs/RegistrationTab';
import FeasibilityTab from './modal-tabs/FeasibilityTab';
import AgreementTab from './modal-tabs/AgreementTab';
import PlantInstallationTab from './modal-tabs/PlantInstallationTab';
import InspectionTab from './modal-tabs/InspectionTab';
import SubsidyClaimTab from './modal-tabs/SubsidyClaimTab';
import SubsidyDisbursalTab from './modal-tabs/SubsidyDisbursalTab';
import HistoryTab from './modal-tabs/HistoryTab';

export default function CustomerModalTabsRouter(props) {
    const { activeTab } = props;
    const tab = String(activeTab || '').trim().toUpperCase();

    // Stage 1: Vender Selection & Registration
    if (tab.includes('VENDER') || tab.includes('VENDOR') || tab.includes('REGISTRATION') || tab.includes('LEADS')) {
        return <RegistrationTab {...props} />;
    }

    // Stages 2 & 3: Upload Agreement (Pending & Final)
    if (tab.includes('AGREEMENT')) {
        return <AgreementTab {...props} />;
    }

    // Stage 4: Rooftop Plant Installation
    if (tab.includes('INSTALLATION') || tab.includes('INSTALL')) {
        return <PlantInstallationTab {...props} />;
    }

    // Stages 5 & 6: Inspection (Pending & Final) & Net Metering
    if (tab.includes('INSPECT') || tab.includes('METER')) {
        return <InspectionTab {...props} />;
    }

    // Stage 7: Subsidy Request / Claim
    if (tab === 'SUBSIDY REQUEST' || tab.includes('REQUEST') || tab.includes('CLAIM') || tab === 'LOAN' || tab === 'CASH') {
        return <SubsidyClaimTab {...props} />;
    }

    // Stages 8, 9, 10, 11: Subsidy Disbursal (Pending, Disbursal, Disbursed, COMPLETE)
    if (tab.includes('DISBURS') || tab.includes('COMPLETE') || tab.includes('DBT')) {
        return <SubsidyDisbursalTab {...props} />;
    }

    // Technical Feasibility Approval
    if (tab.includes('FEASIBILITY')) {
        return <FeasibilityTab {...props} />;
    }

    // Notes & Remarks / History Tab
    if (tab.includes('HISTORY') || tab.includes('NOTE') || tab.includes('REMARK')) {
        return <HistoryTab {...props} />;
    }

    // Default fallback to Registration
    return <RegistrationTab {...props} />;
}


