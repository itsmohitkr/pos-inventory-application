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
  Tooltip,
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
      <Box sx={{ p: 1.5, pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9rem' }}>
          Stock Lots / Batches
        </Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0' }}>
            {batchTrackingEnabled && (
              <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Batch Code</TableCell>
            )}
            <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Qty</TableCell>
            <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              MRP
            </TableCell>
            <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              CP
            </TableCell>
            <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              SP
            </TableCell>
            <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Disc %
            </TableCell>
            <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Margin
            </TableCell>
            {batchTrackingEnabled && (
              <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                EXP
              </TableCell>
            )}
            <TableCell sx={{ px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
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
                  <TableCell sx={{ px: 1.5 }}>
                    <Tooltip title={batch.batchCode || 'N/A'} arrow placement="top">
                      <Typography variant="body2" fontWeight={500} sx={{ cursor: 'help' }}>
                        {batch.batchCode 
                          ? (batch.batchCode.length > 8 ? `${batch.batchCode.substring(0, 8)}...` : batch.batchCode)
                          : 'N/A'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                )}
                <TableCell sx={{ px: 1.5 }}>
                  <Typography variant="body2" fontWeight={600}>{batch.quantity}</Typography>
                </TableCell>
                <TableCell sx={{ px: 1.5 }}>
                  <Typography variant="body2">₹{batch.mrp}</Typography>
                </TableCell>
                <TableCell sx={{ px: 1.5 }}>
                  <Typography variant="body2">₹{batch.costPrice}</Typography>
                </TableCell>
                <TableCell sx={{ px: 1.5 }}>
                  <Typography variant="body2" fontWeight={600}>₹{batch.sellingPrice}</Typography>
                </TableCell>
                <TableCell sx={{ px: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>{discount}%</Typography>
                </TableCell>
                <TableCell sx={{ px: 1.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        margin > 20
                          ? 'success.main'
                          : margin > 10
                            ? 'warning.main'
                            : 'error.main',
                      fontWeight: 600,
                    }}
                  >
                    {margin}%
                  </Typography>
                </TableCell>
                {batchTrackingEnabled && (
                  <TableCell sx={{ px: 1.5 }}>
                    <Typography variant="body2">
                      {batch.expiryDate
                        ? new Date(batch.expiryDate).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                )}
                <TableCell sx={{ px: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
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
