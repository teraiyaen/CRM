const units = {
    WATT: ['w', 'watt', 'watts'], KW: ['kw'], KG: ['kg'],
    MTR: ['m', 'mtr', 'meter', 'meters'], PCS: ['pc', 'pcs'],
    SET: ['set', 'sets'], PAIR: ['pair', 'pairs'], PKT: ['pkt', 'pkts'],
};
const normalized = value => String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();

// Accept the supplied reference notation (120m, 15+15m, nut 1 kg).
// Parse a restricted addition expression, never arbitrary JavaScript.
export function bomQuantity(value, unit) {
    const text = String(value ?? '').trim().toLowerCase();
    if (!text) return 0;
    return text.split('+').reduce((total, part) => {
        const match = part.trim().match(/^(?:(nut|washer|wisher)\s+)?(\d+(?:\.\d{1,2})?)\s*([a-z]*)$/);
        if (!match || (match[1] && normalized(unit) !== 'KG') ||
            (match[3] && !(units[normalized(unit)] || []).includes(match[3]))) {
            throw new Error(`Invalid quantity “${value}” for ${unit}. Enter a number or a sum such as 15+15.`);
        }
        const cents = Math.round(Number(match[2]) * 100);
        if (!Number.isSafeInteger(cents) || !Number.isSafeInteger(total + cents)) throw new Error('Quantity is too large.');
        return total + cents;
    }, 0) / 100;
}

export function bomStockMovements(items, inventory) {
    const totals = new Map();
    for (const item of items) {
        let quantity;
        try {
            quantity = ['col1', 'col2', 'col3'].reduce((sum, key) => sum + Math.round(bomQuantity(item[key], item.unit) * 100), 0) / 100;
        } catch (error) { throw new Error(`Row ${item.sr}: ${error.message}`); }
        if (!quantity) continue;
        const matches = inventory.filter(stock => !stock.is_sample && normalized(stock.material_description) === normalized(item.name));
        if (matches.length !== 1) throw new Error(`Row ${item.sr}: ${matches.length ? 'Multiple Godown items match' : 'No Godown item matches'} ${item.name}. Correct the Godown material before creating the BOM.`);
        const stock = matches[0];
        if (normalized(stock.unit) !== normalized(item.unit)) throw new Error(`Row ${item.sr}: BOM unit ${item.unit} does not match Godown unit ${stock.unit} for ${item.name}.`);
        totals.set(stock.id, (totals.get(stock.id) || 0) + Math.round(quantity * 100));
    }
    const movements = [...totals].map(([inventory_id, cents]) => {
        if (!Number.isSafeInteger(cents) || cents >= 1e12) throw new Error('Total stock quantity is too large.');
        return { inventory_id, quantity: cents / 100 };
    });
    if (!movements.length) throw new Error('Enter a positive material quantity before creating the BOM.');
    return movements;
}
