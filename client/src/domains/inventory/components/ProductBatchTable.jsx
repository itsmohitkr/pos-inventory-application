import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';

const ProductBatchTable = ({ 
  batches, 
  batchTrackingEnabled, 
  onQuickInventoryOpen, 
  onBatchEditClick, 
  onBatchDelete 
}) => {
  return (
    <Box sx={{ flex: 1, overflow: 'auto' }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Stock Lots / Batches
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default' }}>
            {batchTrackingEnabled && (
              <TableCell sx={{ fontWeight: 'bold' }}>Batch Code</TableCell>
            )}
            <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              MRP
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              Cost
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              Selling
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Disc %
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Margin
            </TableCell>
            {batchTrackingEnabled && (
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Expiry
              </TableCell>
            )}
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {batches.map((batch) => {
            const margin =
              batch.sellingPrice > 0
                ? (((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100).toFixed(1)
                : 0;
            const discount =
              batch.mrp > 0
                ? (((batch.mrp - batch.sellingPrice) / batch.mrp) * 100).toFixed(1)
                : 0;
            
            return (
              <TableRow key={batch.id} data-testid={`inventory-batch-row-${batch.id}`}>
                {batchTrackingEnabled && (
                  <TableCell>{batch.batchCode || 'N/A'}</TableCell>
                )}
                <TableCell>{batch.quantity}</TableCell>
                <TableCell align="right">₹{batch.mrp}</TableCell>
                <TableCell align="right">₹{batch.costPrice}</TableCell>
                <TableCell align="right">₹{batch.sellingPrice}</TableCell>
                <TableCell align="center">
                  <Box sx={{ color: 'primary.main', fontWeight: 'bold' }}>{discount}%</Box>
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      color:
                        margin > 20
                          ? 'success.main'
                          : margin > 10
                            ? 'warning.main'
                            : 'error.main',
                      fontWeight: 'bold',
                    }}
                  >
                    {margin}%
                  </Box>
                </TableCell>
                {batchTrackingEnabled && (
                  <TableCell align="right">
                    {batch.expiryDate
                      ? new Date(batch.expiryDate).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                )}
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                    <ActionButton
                      icon={<InventoryIcon fontSize="small" />}
                      label="Stock"
                      onClick={() => onQuickInventoryOpen(batch)}
                      color="#1f8a5b"
                      testId={`inventory-quick-stock-${batch.id}`}
                    />
                    <ActionButton
                      icon={<EditIcon fontSize="small" />}
                      label="Edit"
                      onClick={() => onBatchEditClick(batch)}
                      color="#1f2937"
                    />
                    <ActionButton
                      icon={<DeleteIcon fontSize="small" />}
                      label="Delete"
                      onClick={() => onBatchDelete(batch.id)}
                      color="#ef4444"
                    />
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

const ActionButton = ({ icon, label, onClick, color, testId }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
    <IconButton
      size="small"
      onClick={onClick}
      data-testid={testId}
      sx={{
        bgcolor: `${color}1A`, // 10% opacity
        color: color,
        '&:hover': { bgcolor: `${color}33` }, // 20% opacity
      }}
    >
      {icon}
    </IconButton>
    <Typography
      variant="caption"
      sx={{ fontSize: '0.65rem', fontWeight: 600, color: color }}
    >
      {label}
    </Typography>
  </Box>
);

export default ProductBatchTable;
