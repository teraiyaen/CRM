const sampleStock = [
    ['demo-panel-v1', 6, 'PCS'], ['demo-inverter-v1', 1, 'PCS'],
    ['demo-combo-v1', 1, 'SET'], ['demo-pipe-v1', 6, 'KG'],
    ['demo-earth-v1', 1, 'SET'], ['demo-dc-v1', 120, 'MTR'],
    ['demo-ac-v1', 30, 'MTR'], ['demo-mc4-v1', 10, 'PAIR'],
    ['demo-bolt-v1', 26, 'PCS'], ['demo-pvc-v1', 10, 'PCS'],
];

export function sampleBomMovements(inventory) {
    return sampleStock.map(([key, quantity, unit]) => {
        const item = inventory.find(row => row.is_sample === true && row.sample_key === key);
        if (!item || item.unit !== unit) throw new Error('The sample materials are missing or their units have changed. Refresh after running the sample stock SQL.');
        if (!Number.isFinite(Number(item.in_stock)) || Number(item.in_stock) < quantity) throw new Error(`Not enough sample stock for ${item.material_description}. Add stock before autofilling.`);
        return { inventory_id: item.id, quantity: String(quantity) };
    });
}

export const SAMPLE_BOM_DETAILS = {
    vehicleNo: 'SAMPLE VEHICLE', driverName: 'Sample driver', driverContact: '',
    dealerName: 'Sample dealer', dispatchedBy: '', approvedBy: '',
    portalCharge: '0', meterFee: '0', materialCondition: 'SAMPLE BOM — testing only', customerSign: '',
};
