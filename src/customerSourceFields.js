// Based on the Supabase structure supplied by the user.
export const CUSTOMER_FIELD_GROUPS = {
  "basic": [
    {
      "key": "consumer_name",
      "label": "Consumer name",
      "type": "text"
    },
    {
      "key": "consumer_number",
      "label": "Consumer number",
      "type": "text"
    },
    {
      "key": "mobile_no",
      "label": "Mobile no",
      "type": "text"
    },
    {
      "key": "email",
      "label": "Email",
      "type": "text"
    },
    {
      "key": "address",
      "label": "Address",
      "type": "text"
    },
    {
      "key": "circle",
      "label": "Circle",
      "type": "text"
    },
    {
      "key": "division",
      "label": "Division",
      "type": "text"
    },
    {
      "key": "sub_division",
      "label": "Sub division",
      "type": "text"
    },
    {
      "key": "discom_name",
      "label": "Discom name",
      "type": "text"
    },
    {
      "key": "application_number",
      "label": "Application number",
      "type": "text"
    },
    {
      "key": "sr_no",
      "label": "Serial number",
      "type": "text"
    },
    {
      "key": "application_date",
      "label": "Application date",
      "type": "date"
    },
    {
      "key": "submitted_on",
      "label": "Submitted on",
      "type": "date"
    },
    {
      "key": "dealer",
      "label": "Dealer",
      "type": "text"
    },
    {
      "key": "ref_agent",
      "label": "Ref agent",
      "type": "text"
    },
  ],
  "discom": [
    {
      "key": "application_number",
      "label": "Application number",
      "type": "text"
    },
    {
      "key": "application_date",
      "label": "Application date",
      "type": "date"
    },
    {
      "key": "submitted_on",
      "label": "Submitted on",
      "type": "date"
    },
    {
      "key": "status",
      "label": "Status",
      "type": "text"
    },
    {
      "key": "portal_status",
      "label": "Portal status",
      "type": "text"
    }
  ],
  "technical": [
    {
      "key": "proposed_capacity_kw",
      "label": "Proposed capacity kw",
      "type": "number"
    },
    {
      "key": "panel_brand",
      "label": "Panel brand",
      "type": "text"
    },
    {
      "key": "panel_wattage_wp",
      "label": "Panel wattage wp",
      "type": "number"
    },
    {
      "key": "panel_quantity",
      "label": "Panel quantity",
      "type": "number"
    },
    {
      "key": "inverter_brand",
      "label": "Inverter brand",
      "type": "text"
    },
    {
      "key": "inverter_capacity_kw",
      "label": "Inverter capacity kw",
      "type": "number"
    },
    {
      "key": "dispatch_date",
      "label": "Dispatch date",
      "type": "date"
    }
  ],
  "finance": [
    {
      "key": "actual_payment",
      "label": "Quotation amount (₹)",
      "type": "number"
    },
    {
      "key": "payment",
      "label": "Amount received (₹)",
      "type": "number"
    },
    {
      "key": "left",
      "label": "Left (₹)",
      "type": "calculated"
    },
    {
      "key": "payment_date",
      "label": "Payment date",
      "type": "date"
    },
    {
      "key": "payment_mode_raw",
      "label": "Payment mode / date (source)",
      "type": "text"
    },
    {
      "key": "meter_charge",
      "label": "Meter charge",
      "type": "number"
    },
    {
      "key": "charge",
      "label": "Charge",
      "type": "number"
    },
    {
      "key": "stamp",
      "label": "Stamp charge (\u20b9)",
      "type": "number"
    },
    {
      "key": "financing_tag",
      "label": "Financing tag",
      "type": "text"
    },
    {
      "key": "loan_status",
      "label": "Loan status",
      "type": "text"
    },
    {
      "key": "loan_disbursed_amount",
      "label": "Loan disbursed amount",
      "type": "number"
    },
    {
      "key": "first_tranche_date",
      "label": "First tranche date",
      "type": "date"
    },
    {
      "key": "second_tranche_date",
      "label": "Second tranche date",
      "type": "date"
    }
  ]
};
export const MIS_SOURCE_FIELDS = [
  "application_number",
  "serial_number",
  "application_submitted_date",
  "consumer_registration_number",
  "scheme",
  "current_status_of_application",
  "consumer_name",
  "mobile_no_of_consumer",
  "email_of_consumer",
  "consumer_address",
  "district_name",
  "state_name",
  "consumer_number",
  "vendor_selection_date_by_consumer",
  "vendor_consent_date",
  "vendor_consumer_agreement_uploaded",
  "vendor_consumer_agreement_uploading_date",
  "connection_category_name",
  "sanction_load_kwp",
  "proposed_pv_capacity_kwp",
  "discom_name",
  "circle_name",
  "division_name",
  "sub_division_name",
  "has_existing_capacity",
  "existing_capacity_kwp",
  "loan_taken",
  "loan_application_date",
  "loan_applied_at_bank",
  "bank_branch_address",
  "loan_status",
  "loan_sanctioned_date",
  "loan_rejection_date",
  "loan_disbursed_date_first_tranche",
  "loan_disbursed_amount_first_tranche",
  "loan_first_tranche_disbursal_utr",
  "loan_disbursed_date_second_tranche",
  "loan_disbursed_amount_second_tranche",
  "loan_second_tranche_disbursal_utr",
  "feasibility_applied_kw",
  "feasibility_approved_date",
  "feasibility_returned_date",
  "feasibility_return_remarks",
  "solar_plant_installation_date",
  "installed_pv_module_capacity_kwp",
  "pv_module_make",
  "module_capacity_wp",
  "module_quantity",
  "pv_module_serial_no",
  "inverter_capacity_kw",
  "inverter_make",
  "inverter_quantity",
  "inspection_status",
  "inspection_date",
  "inspection_return_date",
  "inspection_return_comment",
  "subsidy_redeem_date",
  "subsidy_amount",
  "subsidy_return_date",
  "subsidy_return_to",
  "subsidy_return_comment",
  "subsidy_verified_date",
  "subsidy_disbursed_date",
  "last_comment",
  "last_comment_date",
  "no_of_house_rwa"
];
