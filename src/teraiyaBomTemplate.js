// Fixed cells transcribed from solar matrial list (1).pdf.
export const TERAIYA_BOM_HEADINGS = ['Ramesh Makwana', 'Bhupat Dhindhava', 'Bhati Narshi'];
export const TERAIYA_BOM_DEFAULT_ITEMS = [
    { sr: 1, name: 'SOLAR PANEL (ADANI 550wp)', col1: '6', col2: '6', col3: '6', unit: 'WATT', remark: '' },
    { sr: 2, name: 'SOLAR INVERTER (MAKE: )', col1: '1', col2: '1', col3: '1', unit: 'KW', remark: '' },
    { sr: 3, name: 'ACDC COMBO (MCB+MCB)', col1: '1', col2: '1', col3: '1', unit: 'SET', remark: '' },
    { sr: 4, name: 'ACDC COMBO (MCB+FUSE)', col1: '', col2: '', col3: '', unit: 'SET', remark: '' },
    { sr: 5, name: '40*40 PIPE (MAKE: )', col1: '6', col2: '5', col3: '5', unit: 'KG', remark: '' },
    { sr: 6, name: '60*40 PIPE (MAKE: )', col1: '', col2: '', col3: '4', unit: 'KG', remark: '' },
    { sr: 7, name: '80*40 PIPE (MAKE: )', col1: '4', col2: '4', col3: '', unit: 'KG', remark: '' },
    { sr: 8, name: 'EARTHING KIT WITH MULTI SPIKE', col1: '1', col2: '1', col3: '1', unit: 'SET', remark: '10 KG BAG' },
    { sr: 9, name: 'POLYCAB 2.5 SQ.MM. (DC)', col1: '', col2: '', col3: '', unit: 'MTR', remark: '' },
    { sr: 10, name: 'POLYCAB 4 SQ.MM. (DC)', col1: '120m', col2: '', col3: '', unit: 'MTR', remark: '' },
    { sr: 11, name: 'POLYCAB 2.5 SQ.MM. (AC)', col1: '', col2: '', col3: '', unit: 'MTR', remark: '' },
    { sr: 12, name: 'POLYCAB 4 SQ.MM. (AC)', col1: '15+15m', col2: '', col3: '', unit: 'MTR', remark: '' },
    { sr: 13, name: 'GALCAB 2.5 SQ.MM EARTHING (AC)', col1: '80m', col2: '', col3: '', unit: 'MTR', remark: '' },
    { sr: 14, name: 'GALCAB 4 SQ.MM EARTHING (AC)', col1: '', col2: '', col3: '', unit: 'MTR', remark: '' },
    { sr: 15, name: 'GALCAB 6 SQ.MM EARTHING (AC)', col1: '', col2: '', col3: '', unit: 'MTR', remark: '' },
    { sr: 16, name: 'GALCAB 16 SQ.MM LA', col1: '70m', col2: '', col3: '', unit: 'MTR', remark: '' },
    { sr: 17, name: 'MC 4', col1: '10', col2: '', col3: '', unit: 'PAIR', remark: '' },
    { sr: 18, name: 'FASTENER', col1: '', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 19, name: 'M8 J BOLT (40*40)', col1: '26', col2: '26', col3: '26', unit: 'PCS', remark: '' },
    { sr: 20, name: 'M8 J BOLT (60*40)', col1: '', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 21, name: 'CABLE TIE', col1: '2', col2: '', col3: '', unit: 'PKT', remark: '' },
    { sr: 22, name: 'BASE PLATE', col1: '', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 23, name: 'L ANGLE', col1: '18', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 24, name: 'STUD', col1: '5', col2: '', col3: '3', unit: 'PCS', remark: '' },
    { sr: 25, name: 'NUT WAHER', col1: 'nut 1 kg', col2: 'wisher 2kg', col3: '', unit: 'KG', mergeLastColumns: true, remark: '' },
    { sr: 26, name: '25MM PVC PIPE POLYCAB', col1: '10', col2: '8', col3: '10', unit: 'PCS', remark: '' },
    { sr: 27, name: 'TEE PVC', col1: '20', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 28, name: 'BEND PVC', col1: '50', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 29, name: 'C CLAMP PVC', col1: '2', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 30, name: 'SPRAY (ML: )', col1: '3', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 31, name: 'MID CLAMP (SIZE: ) SET', col1: '', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 32, name: 'END CLAMP (SIZE: ) SET', col1: '', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 33, name: 'FOUNDATION BAG (9w*7h)', col1: '5', col2: '', col3: '', unit: 'PCS', remark: '' },
    { sr: 34, name: 'FOUNDATION BOX (9*9)', col1: '5', col2: '', col3: '', unit: 'PCS', remark: '' },
];

export const createTeraiyaBomItems = () => [
    ...TERAIYA_BOM_DEFAULT_ITEMS.map(item => ({ ...item, detail: '' })),
    ...Array.from({ length: 4 }, (_, index) => ({ sr: 35 + index, name: '', col1: '', col2: '', col3: '', unit: '', remark: '', detail: '' })),
];
export function isFixedBomCell(sr, key) {
    const row = TERAIYA_BOM_DEFAULT_ITEMS.find(item => item.sr === sr);
    return Boolean(row && row[key] !== undefined && row[key] !== '');
}
// Fixed template cells cannot be overridden by form or previously stored values.
export function resolveTeraiyaBomItems(items) {
    return createTeraiyaBomItems().map(base => {
        const entered = items?.find(item => item.sr === base.sr) || {};
        const row = { ...base };
        for (const key of ['name', 'col1', 'col2', 'col3', 'unit', 'remark', 'detail']) {
            if (!isFixedBomCell(base.sr, key)) row[key] = entered[key] ?? base[key];
        }
        return row;
    });
}
export function materialDescription(item) {
    return item.detail ? item.name.replace(/(MAKE:|ML:|SIZE:)\s*/, '$1 ' + item.detail + ' ') : item.name;
}
