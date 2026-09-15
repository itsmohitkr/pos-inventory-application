import React from 'react';
import type { ReportSale } from '@/shared/types/models';
import type { SaleStats } from '@/domains/saleHistory/components/saleHistoryStats';
import {
  Box,
  Typography,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import InventoryPanelShell from '@/domains/inventory/components/InventoryPanelShell';
interface POSSaleDetailsPanelProps {
  selectedSale?: ReportSale | null;
  stats: SaleStats;
}

const POSSaleDetailsPanel = ({ selectedSale, stats }: POSSaleDetailsPanelProps) => {
  if (!selectedSale) {
    return (
      <InventoryPanelShell>
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%',
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39', mb: 1 }}>
              No Transaction Selected
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              Select a POS sale from the list to view its full details.
            </Typography>
          </Box>
        </Box>
      </InventoryPanelShell>
    );
  }

  // Net of returns, matching how saleHistoryStats.ts computes mrpDiscount/
  // subtotal and how the QTY column below already displays returned items
  // (struck-through original, net quantity kept).
  const totalQuantity = selectedSale.items.reduce(
    (sum, item) => sum + (item.quantity - (item.returnedQuantity || 0)),
    0
  );

  return (
    <InventoryPanelShell
      title={`Order Details - ORD-${selectedSale.id}`}
      headerRight={
        <Chip
          label={selectedSale.paymentMethod || 'Cash'}
          size="small"
          variant="outlined"
          sx={{
            height: 22,
            fontWeight: 700,
            fontSize: '0.68rem',
            color: selectedSale.paymentMethod === 'Cash' ? '#0b1d39' : '#1e293b',
            borderColor: selectedSale.paymentMethod === 'Cash' ? '#0b1d39' : '#cbd5e1',
          }}
        />
      }
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          bgcolor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Order Stats & Metadata Section touching left-to-right */}
        <Box
          sx={{
            p: 1.5,
            px: 2,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            flexShrink: 0,
          }}
        >
          {/* Metadata Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>
                {new Date(selectedSale.createdAt).toLocaleDateString()}{' · '}{new Date(selectedSale.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
              <Chip
                label={`${selectedSale.items.length} ${selectedSale.items.length === 1 ? 'Item' : 'Items'}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(11, 29, 57, 0.06)',
                  color: '#0b1d39',
                  borderRadius: '4px',
                }}
              />
              <Chip
                label={`Qty: ${totalQuantity}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(11, 29, 57, 0.06)',
                  color: '#0b1d39',
                  borderRadius: '4px',
                }}
              />
            </Box>
          </Box>

          {/* Consistent Stat Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 1.25,
            }}
          >
            {/* Amount Paid Card */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: '#3b82f633',
                borderRadius: '8px',
                py: 1,
                px: 1.25,
                bgcolor: '#3b82f60A',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minWidth: 0,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#3b82f61A',
                  borderColor: '#3b82f666',
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#3b82f6',
                  textTransform: 'uppercase',
                  fontSize: '0.68rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600,
                  display: 'block',
                  mb: 0.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Amount Paid
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#0b1d39',
                  fontSize: '0.92rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                ₹{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {/* Total Discount Card */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: '#f43f5e33',
                borderRadius: '8px',
                py: 1,
                px: 1.25,
                bgcolor: '#f43f5e0A',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minWidth: 0,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#f43f5e1A',
                  borderColor: '#f43f5e66',
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#f43f5e',
                  textTransform: 'uppercase',
                  fontSize: '0.68rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600,
                  display: 'block',
                  mb: 0.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Total Discount
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#0b1d39',
                  fontSize: '0.92rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                ₹{(stats.totalDiscount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: '#64748b',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  mt: 0.25,
                  fontSize: '0.68rem',
                }}
              >
                ₹{stats.mrpDiscount.toFixed(2)} MRP + ₹{stats.extraDiscount.toFixed(2)} Extra · {stats.discountPercent}%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Section Header: Products */}
        <Box
          sx={{
            p: 1.25,
            px: 2,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0b1d39' }}>
            Products ({selectedSale.items.length})
          </Typography>
        </Box>

        {/* Products Table touching from left to right */}
        <TableContainer sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    py: 1.25,
                    pl: 2,
                    pr: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  PRODUCT
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    py: 1.25,
                    px: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  QTY
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    py: 1.25,
                    px: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  MRP (₹)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    py: 1.25,
                    px: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  PRICE (₹)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    py: 1.25,
                    pl: 1.5,
                    pr: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  DISCOUNT (₹)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedSale.items.map((item) => {
                const mrp = item.mrp || item.sellingPrice;
                const itemDiscount = mrp - item.sellingPrice;
                const itemDiscountPercent = mrp > 0 ? ((itemDiscount / mrp) * 100).toFixed(1) : 0;
                const returnedQty = item.returnedQuantity || 0;

                return (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#f8fafc' },
                      '& td': {
                        py: 1,
                        px: 1.5,
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '0.82rem',
                      },
                      '& td:first-of-type': {
                        pl: 2,
                      },
                      '& td:last-of-type': {
                        pr: 2,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <span>{item.productName}</span>
                        {item.isFree && (
                          <Chip
                            label="GIFT"
                            size="small"
                            sx={{
                              bgcolor: '#22ab7dff',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              height: 20,
                              borderRadius: '4px',
                            }}
                          />
                        )}
                        {item.isWholesale && (
                          <Chip
                            label="WHOLESALE"
                            size="small"
                            sx={{
                              bgcolor: '#f59e0b',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              height: 20,
                              borderRadius: '4px',
                            }}
                          />
                        )}
                        {item.isOnSale && (
                          <Chip
                            label="SALE OFFER"
                            size="small"
                            sx={{
                              bgcolor: '#7c3aed',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              height: 20,
                              borderRadius: '4px',
                            }}
                          />
                        )}
                        {returnedQty > 0 && (
                          <Chip
                            label={returnedQty === item.quantity ? 'REFUNDED' : 'RETURNED'}
                            size="small"
                            sx={{
                              bgcolor: returnedQty === item.quantity ? '#ffebee' : '#e8f5e9',
                              color: returnedQty === item.quantity ? '#d32f2f' : '#2e7d32',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              height: 20,
                              borderRadius: '4px',
                              border: returnedQty === item.quantity ? '1px solid #ffcdd2' : '1px solid #c8e6c9',
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {returnedQty > 0 ? (
                        <Box component="span">
                          <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.5, mr: 0.5 }}>
                            {item.quantity}
                          </Box>
                          {item.quantity - returnedQty}
                        </Box>
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    <TableCell align="right">{mrp.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{item.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 700, fontSize: '0.82rem' }}>
                          {itemDiscount.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          ({itemDiscountPercent}%)
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </InventoryPanelShell>
  );
};

export default POSSaleDetailsPanel;
