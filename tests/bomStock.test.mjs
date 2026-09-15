import assert from 'node:assert/strict';
import { bomQuantity, bomStockMovements } from '../src/utils/bomStock.js';
import { createTeraiyaBomItems, autofillBomQuantities } from '../src/teraiyaBomTemplate.js';
assert.equal(bomQuantity('15+15m', 'MTR'), 30);
assert.equal(bomQuantity('nut 1 kg', 'KG'), 1);
assert.equal(bomQuantity('wisher 2kg', 'KG'), 2);
assert.equal(bomQuantity('', 'PCS'), 0);
assert.equal(bomQuantity('0.1+0.2', 'KG'), 0.3);
for (const value of ['-1', '1e3', '1/2', '2abc', '1.234', 'NaN', '1++2']) {
    assert.throws(() => bomQuantity(value, 'KG'));
}
assert.throws(() => bomQuantity('2kg', 'MTR'));
const items = createTeraiyaBomItems();
assert.equal(items.length, 34);
const inventory = items.slice(0,34).map(item => ({id:`item-${item.sr}`, material_description:item.name,unit:item.unit,is_sample:false}));
const movements = bomStockMovements(items, inventory);
assert.equal(movements.find(row=>row.inventory_id==='item-1').quantity,18);
assert.equal(movements.find(row=>row.inventory_id==='item-12').quantity,30);
assert.equal(movements.find(row=>row.inventory_id==='item-25').quantity,3);
assert(!movements.some(row=>row.inventory_id==='item-4'));
assert.equal(bomStockMovements(autofillBomQuantities(items),inventory).find(row=>row.inventory_id==='item-12').quantity,90);
assert.throws(()=>bomStockMovements(items,inventory.slice(1)),/No Godown item/);
assert.throws(()=>bomStockMovements(items,[...inventory,inventory[0]]),/Multiple Godown/);
assert.throws(()=>bomStockMovements(items,inventory.map(row=>({...row,is_sample:true}))),/No Godown item/);
assert.throws(()=>bomStockMovements(items,inventory.map(row=>row.id==='item-1'?{...row,unit:'PCS'}:row)),/does not match/);
assert.throws(()=>bomStockMovements([],inventory),/positive material/);
assert.equal(bomStockMovements([items[0],{...items[0],sr:35}],inventory)[0].quantity,36);
console.log('BOM stock checks passed: sums, units, reference text, decimal precision, zero rows, matching, sample exclusion, grouped materials.');
