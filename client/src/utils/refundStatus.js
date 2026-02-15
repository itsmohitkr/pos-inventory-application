/**
 * Determines the refund status of a sale based on returned items
 * Returns: 'full', 'partial', or 'none'
 */
export const getRefundStatus = (items) => {
    if (!items || items.length === 0) return 'none';
    
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const returnedQty = items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);
    
    if (returnedQty === 0) return 'none';
    if (returnedQty === totalQty) return 'full';
    return 'partial';
};

/**
 * Get status display label and color
 */
export const getStatusDisplay = (status) => {
    switch (status) {
        case 'full':
            return {
                label: 'Refunded',
                color: '#d32f2f',
                bgcolor: '#ffebee'
            };
        case 'partial':
            return {
                label: 'Partially Refunded',
                color: '#ed6c02',
                bgcolor: '#fff3e0'
            };
        case 'none':
            return {
                label: 'Completed',
                color: '#2e7d32',
                bgcolor: '#e8f5e9'
            };
        default:
            return {
                label: 'Unknown',
                color: '#666',
                bgcolor: '#f5f5f5'
            };
    }
};
