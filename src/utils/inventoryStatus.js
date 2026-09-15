export function inventoryStatus(item) {
    const stock = Number(item.in_stock);
    const threshold = Number(item.threshold_qty);
    if (item.in_stock == null || !Number.isFinite(stock)) return 'Unknown';
    if (stock <= 0) return 'Out of stock';
    if (item.threshold_qty == null || !Number.isFinite(threshold) || threshold < 0) return 'Threshold not set';
    return stock <= threshold ? 'Low stock' : 'Sufficient';
}
