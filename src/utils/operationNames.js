import { COLLECTED_REFERRING_AGENTS } from './collectedReferringAgents';
// Brand choices curated from collected upload2.csv and mis_supabase_ready.csv.
// Casing, repeated comma-separated names and Ltd/Limited variants are consolidated.
// Phone numbers, application statuses and incomplete brand values are excluded.
export const COLLECTED_BRANDS = {
    ref_agent: COLLECTED_REFERRING_AGENTS,
    module_brand: ['Adani', 'Mundra Solar Energy Limited', 'Mundra Solar PV Limited', 'Mundra Solar Pvt. Ltd.', 'Waaree Energies Limited', 'Kosol Energie Pvt. Ltd.', 'Tata Power Renewable Energy Limited', 'Goldi Sun Private Limited', 'Rayzon Solar Limited'],
    inverter_make: ['Polycab', 'Solaryaan', 'SolaX Power', 'Waaree', 'Solis', 'Sunways'],
};
export const OPERATION_CATEGORIES = ['installation_vendor', 'channel_partner', 'module_brand', 'inverter_make', 'ref_agent'];
export function operationNames(rows, category, currentValue = '') {
    const names = new Map();
    // Preserve the current spelling/value so existing customer records do not change.
    for (const value of [currentValue, ...(COLLECTED_BRANDS[category] || []), ...rows.filter(row => row.category === category).map(row => row.label)]) {
        const name = String(value || '').trim();
        if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
    }
    return [...names.values()].sort((a,b) => a.localeCompare(b));
}
