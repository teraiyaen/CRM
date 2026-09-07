-- =====================================================================
-- FIX FOR ERROR 22001: EXPAND VARCHAR LIMITS TO TEXT IN `mis` TABLE
-- =====================================================================

DROP TABLE IF EXISTS public.mis CASCADE;

CREATE TABLE public.mis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification & Registration
    application_number TEXT,
    serial_number TEXT,
    application_submitted_date DATE,
    consumer_registration_number TEXT,
    scheme TEXT,
    current_status_of_application TEXT,
    consumer_name TEXT,
    mobile_no_of_consumer TEXT,
    email_of_consumer TEXT,
    consumer_address TEXT,
    district_name TEXT,
    state_name TEXT,
    consumer_number TEXT NOT NULL,
    
    -- Vendor & Agreement
    vendor_selection_date_by_consumer DATE,
    vendor_consent_date DATE,
    vendor_consumer_agreement_uploaded TEXT,
    vendor_consumer_agreement_uploading_date DATE,
    connection_category_name TEXT,
    sanction_load_kwp NUMERIC(10, 2),
    proposed_pv_capacity_kwp NUMERIC(10, 2),
    
    -- Discom Hierarchy
    discom_name TEXT,
    circle_name TEXT,
    division_name TEXT,
    sub_division_name TEXT,
    has_existing_capacity TEXT,
    existing_capacity_kwp NUMERIC(10, 2),
    
    -- Loan & Financing Details
    loan_taken TEXT,
    loan_application_date DATE,
    loan_applied_at_bank TEXT,
    bank_branch_address TEXT,
    loan_status TEXT,
    loan_sanctioned_date DATE,
    loan_rejection_date DATE,
    loan_disbursed_date_first_tranche DATE,
    loan_disbursed_amount_first_tranche NUMERIC(12, 2),
    loan_first_tranche_disbursal_utr TEXT,
    loan_disbursed_date_second_tranche DATE,
    loan_disbursed_amount_second_tranche NUMERIC(12, 2),
    loan_second_tranche_disbursal_utr TEXT,
    
    -- Feasibility & Technicals
    feasibility_applied_kw NUMERIC(10, 2),
    feasibility_approved_date DATE,
    feasibility_returned_date DATE,
    feasibility_return_remarks TEXT,
    solar_plant_installation_date DATE,
    installed_pv_module_capacity_kwp NUMERIC(10, 2),
    pv_module_make TEXT,
    module_capacity_wp NUMERIC(10, 2),
    module_quantity INTEGER,
    pv_module_serial_no TEXT,
    inverter_capacity_kw NUMERIC(10, 2),
    inverter_make TEXT,
    inverter_quantity INTEGER,
    
    -- Inspection & Commissioning
    inspection_status TEXT,
    inspection_date DATE,
    inspection_return_date DATE,
    inspection_return_comment TEXT,
    
    -- Subsidy Tracking
    subsidy_redeem_date DATE,
    subsidy_amount NUMERIC(12, 2),
    subsidy_return_date DATE,
    subsidy_return_to TEXT,
    subsidy_return_comment TEXT,
    subsidy_verified_date DATE,
    subsidy_disbursed_date DATE,
    last_comment TEXT,
    last_comment_date DATE,
    no_of_house_rwa TEXT,
    
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mis_consumer_number ON public.mis (consumer_number);

CREATE OR REPLACE FUNCTION public.sync_admin_from_mis()
RETURNS TRIGGER AS $$
DECLARE
    clean_consumer TEXT;
BEGIN
    clean_consumer := UPPER(REGEXP_REPLACE(TRIM(NEW.consumer_number), '[^0-9A-Za-z]', '', 'g'));
    IF clean_consumer LIKE '%.0' THEN
        clean_consumer := SUBSTRING(clean_consumer FROM 1 FOR LENGTH(clean_consumer) - 2);
    END IF;

    IF EXISTS (SELECT 1 FROM public.admin WHERE consumer_number = clean_consumer) THEN
        UPDATE public.admin
        SET
            status = COALESCE(NEW.current_status_of_application, public.admin.status),
            portal_status = COALESCE(NEW.current_status_of_application, public.admin.portal_status),
            application_number = COALESCE(NEW.application_number, public.admin.application_number),
            submitted_on = COALESCE(NEW.application_submitted_date, public.admin.submitted_on),
            first_tranche_date = COALESCE(NEW.loan_disbursed_date_first_tranche, public.admin.first_tranche_date),
            second_tranche_date = COALESCE(NEW.loan_disbursed_date_second_tranche, public.admin.second_tranche_date),
            dispatch_date = COALESCE(NEW.solar_plant_installation_date, public.admin.dispatch_date),
            panel_brand = COALESCE(NEW.pv_module_make, public.admin.panel_brand),
            panel_wattage_wp = COALESCE(NEW.module_capacity_wp, public.admin.panel_wattage_wp),
            panel_quantity = COALESCE(NEW.module_quantity, public.admin.panel_quantity),
            inverter_brand = COALESCE(NEW.inverter_make, public.admin.inverter_brand),
            inverter_capacity_kw = COALESCE(NEW.inverter_capacity_kw, public.admin.inverter_capacity_kw),
            remarks = CASE 
                WHEN NEW.inspection_return_comment IS NOT NULL AND NEW.inspection_return_comment != '' 
                THEN COALESCE(public.admin.remarks || '; ', '') || 'Inspection: ' || NEW.inspection_return_comment
                WHEN NEW.last_comment IS NOT NULL AND NEW.last_comment != ''
                THEN COALESCE(public.admin.remarks || '; ', '') || 'MIS: ' || NEW.last_comment
                ELSE public.admin.remarks
            END,
            updated_at = NOW()
        WHERE consumer_number = clean_consumer;
    ELSE
        INSERT INTO public.admin (
            consumer_number, application_number, consumer_name, mobile_no, email,
            address, circle, division, sub_division, discom_name,
            proposed_capacity_kw, status, portal_status, submitted_on,
            first_tranche_date, second_tranche_date, dispatch_date,
            panel_brand, panel_wattage_wp, panel_quantity,
            inverter_brand, inverter_capacity_kw, sources, created_at, updated_at
        ) VALUES (
            clean_consumer, NEW.application_number, NEW.consumer_name, NEW.mobile_no_of_consumer, NEW.email_of_consumer,
            NEW.consumer_address, NEW.circle_name, NEW.division_name, NEW.sub_division_name, NEW.discom_name,
            NEW.proposed_pv_capacity_kwp, NEW.current_status_of_application, NEW.current_status_of_application, NEW.application_submitted_date,
            NEW.loan_disbursed_date_first_tranche, NEW.loan_disbursed_date_second_tranche, NEW.solar_plant_installation_date,
            NEW.pv_module_make, NEW.module_capacity_wp, NEW.module_quantity,
            NEW.inverter_make, NEW.inverter_capacity_kw, 'MIS_AUTO_SYNC', NOW(), NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_admin_from_mis ON public.mis;
CREATE TRIGGER trg_sync_admin_from_mis
AFTER INSERT ON public.mis
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_from_mis();
