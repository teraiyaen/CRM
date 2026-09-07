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

    // Stage 1: Registration & Application
    if (tab === 'REGISTRATION' || tab === 'LEADS' || tab === STAGE_IDS.REGISTRATION) {
        return <RegistrationTab {...props} />;
    }

    // Stage 2: Feasibility Approval
    if (tab === 'FEASIBILITY' || tab === STAGE_IDS.FEASIBILITY) {
        return <FeasibilityTab {...props} />;
    }

    // Stage 3: Vendor Selection & Tripartite Agreement
    if (tab === 'UPLOAD AGREEMENT' || tab === 'UPLOAD_AGREEMENT' || tab === 'AGREEMENT' || tab === STAGE_IDS.UPLOAD_AGREEMENT) {
        return <AgreementTab {...props} />;
    }

    // Stage 4: Rooftop Plant Installation
    if (tab === 'INSTALLATION' || tab === 'INSTALLATION_STATUS' || tab === STAGE_IDS.INSTALLATION) {
        return <PlantInstallationTab {...props} />;
    }

    // Stage 5: Inspection & Net Metering
    if (tab === 'INSPECTION' || tab === 'DISCOM_INSPECTION' || tab === 'METER_INSTALLATION' || tab === STAGE_IDS.INSPECTION) {
        return <InspectionTab {...props} />;
    }

    // Stage 6: Subsidy Claim
    if (tab === 'SUBSIDY REQUEST' || tab === 'SUBSIDY_REQUEST' || tab === 'LOAN' || tab === 'CASH' || tab === STAGE_IDS.SUBSIDY_REQUEST) {
        return <SubsidyClaimTab {...props} />;
    }

    // Stage 7: Subsidy Disbursed (DBT)
    if (tab === 'SUBSIDY DISBURSAL' || tab === 'SUBSIDY_DISBURSAL' || tab === 'SUBSIDY_STATUS' || tab === 'COMPLETED' || tab === STAGE_IDS.SUBSIDY_DISBURSAL) {
        return <SubsidyDisbursalTab {...props} />;
    }

    // Notes & Remarks / History Tab
    if (tab === 'HISTORY' || tab === 'NOTES' || tab === 'REMARKS') {
        return <HistoryTab {...props} />;
    }

    // Default fallback to Registration
    return <RegistrationTab {...props} />;
}

