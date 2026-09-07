import React from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Visibility as PreviewIcon,
  ReceiptLong as ReceiptIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import InventoryPanelShell from '@/domains/inventory/components/InventoryPanelShell';
import { formatDateDisplay } from '@/utils/dateUtils';
import type { Customer, CustomerPurchaseHistory } from '@/shared/api/customerService';
import type { Sale, SaleItem } from '@/shared/types/models';

interface SaleColorTheme {
  headerBg: string;
  borderColor: string;
  dateColor: string;
  timeColor: string;
  saleIdColor: string;
  amountColor: string;
  paymentBg: string;
}

const SALE_HEADER_THEME: SaleColorTheme = {
  headerBg: '#f8fafc',
  borderColor: '#e2e8f0',
  dateColor: '#0f172a',
  timeColor: '#64748b',
  saleIdColor: '#2563eb',
  amountColor: '#0f172a',
  paymentBg: '#ffffff',
};

interface CustomerDetailPanelProps {
  customer: Customer | null;
  historyData?: CustomerPurchaseHistory | null;
  isLoadingHistory: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onPreviewCard: (customer: Customer) => void;
}

export const CustomerDetailPanel = ({
  customer,
  historyData,
  isLoadingHistory,
  onClose,
  onEdit,
  onPreviewCard,
}: CustomerDetailPanelProps) => {

  const calculateSaleNet = (sale: Sale) => {
    return sale.items.reduce((sum: number, item: SaleItem) => {
      const netQty = item.quantity - item.returnedQuantity;
      return sum + netQty * item.sellingPrice;
    }, 0);
  };

  const salesCount = historyData?.sales?.length ?? customer?._count?.sales ?? 0;
  const totalSpent =
    historyData?.sales?.reduce((sum: number, s: Sale) => sum + calculateSaleNet(s), 0) ??
    (customer?.totalSpend ?? 0);
  const avgOrder = salesCount > 0 ? totalSpent / salesCount : 0;

  const formatDate = (dateString?: string | null) => (dateString ? formatDateDisplay(dateString) : '—');

  const getSaleDateHighlight = (dateString?: string | null) => {
    if (!dateString) return { date: '—', time: '', isToday: false, isYesterday: false };
    const d = new Date(dateString);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    const date = formatDate(dateString);

    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return { date, time, isToday, isYesterday };
  };

  const headerRight = customer ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title="Preview Customer Card">
        <IconButton
          size="small"
          onClick={() => onPreviewCard(customer)}
          aria-label="Preview Card"
          sx={{
            color: '#3b82f6',
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.08)' },
          }}
        >
          <PreviewIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Edit Customer Details">
        <IconButton
          size="small"
          onClick={() => onEdit(customer)}
          aria-label="Edit Details"
          sx={{
            color: '#64748b',
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(31, 41, 55, 0.08)', color: '#0f172a' },
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ my: 0.5, mx: 0.5, borderColor: '#e2e8f0' }} />

      <Tooltip title="Close Details">
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            color: '#94a3b8',
            borderRadius: '6px',
            '&:hover': { bgcolor: '#fef2f2', color: '#ef4444' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  ) : undefined;

  return (
    <InventoryPanelShell
      title={customer ? 'Customer Details' : undefined}
      headerRight={headerRight}
    >
      {customer ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            p: 1.5,
            bgcolor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
          }}
        >
          {/* Customer Overview Paper (Soft Slate-Navy Palette) */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              px: 2,
              bgcolor: '#f0f4f8',
              borderRadius: '8px',
              border: '1px solid #d9e2ec',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
              flexShrink: 0,
            }}
          >
            {/* Customer Header Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '8px',
                    bgcolor: 'rgba(11, 29, 57, 0.08)',
                    border: '1px solid rgba(11, 29, 57, 0.16)',
                    color: '#0b1d39',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PersonIcon sx={{ fontSize: '1.25rem' }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: '#0b1d39',
                      fontSize: '0.95rem',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {customer.name || 'Unnamed Customer'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                    Phone: {customer.phone}
                  </Typography>
                </Box>
              </Box>

              {customer.customerBarcode && (
                <Chip
                  label={customer.customerBarcode}
                  size="small"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: '#ffffff',
                    color: '#0b1d39',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    height: 22,
                  }}
                />
              )}
            </Box>

            <Divider sx={{ borderColor: '#d9e2ec' }} />

            {/* Overview Fields Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1.25,
                alignItems: 'center',
              }}
            >
              {/* Field 1: Total Purchases */}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 0.25,
                    whiteSpace: 'nowrap',
                  }}
                >
                  TOTAL PURCHASES
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#0b1d39',
                    lineHeight: 1.2,
                  }}
                >
                  {salesCount}
                </Typography>
              </Box>

              {/* Field 2: Net Spent */}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 0.25,
                    whiteSpace: 'nowrap',
                  }}
                >
                  NET SPENT
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#15803d',
                    lineHeight: 1.2,
                  }}
                >
                  ₹{totalSpent.toFixed(0)}
                </Typography>
              </Box>

              {/* Field 3: Avg Order */}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 0.25,
                    whiteSpace: 'nowrap',
                  }}
                >
                  AVG ORDER
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#0369a1',
                    lineHeight: 1.2,
                  }}
                >
                  ₹{avgOrder.toFixed(0)}
                </Typography>
              </Box>

              {/* Field 4: Last Visit */}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 0.25,
                    whiteSpace: 'nowrap',
                  }}
                >
                  LAST VISIT
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: '#334155',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(customer.lastVisit)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Section Header: Purchase History */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 0.5,
              py: 0.25,
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon sx={{ fontSize: 18, color: '#0b1d39' }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.88rem' }}
              >
                Purchase History
              </Typography>
              <Chip
                label={salesCount}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(11, 29, 57, 0.08)',
                  color: '#0b1d39',
                  borderRadius: '4px',
                }}
              />
            </Box>
            {historyData?.sales && historyData.sales.length > 0 && (
              <Typography
                variant="caption"
                sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}
              >
                {salesCount} transaction{salesCount !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>

          {/* Purchase History List */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              pr: 0.5,
            }}
          >
            {isLoadingHistory ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ mt: 1.5, color: '#64748b', fontWeight: 500 }}>
                  Loading purchase history...
                </Typography>
              </Box>
            ) : !historyData || historyData.sales.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: '8px',
                  bgcolor: '#ffffff',
                  borderColor: '#e2e8f0',
                }}
              >
                <Typography color="text.secondary" fontWeight={500} fontSize="0.85rem">
                  No purchase history found for this customer.
                </Typography>
              </Paper>
            ) : (
              historyData.sales.map((sale) => {
                const netAmount = calculateSaleNet(sale);
                const { date, time, isToday, isYesterday } = getSaleDateHighlight(sale.createdAt);
                const theme = SALE_HEADER_THEME;
                return (
                  <Paper
                    key={sale.id}
                    elevation={0}
                    sx={{
                      borderRadius: '8px',
                      bgcolor: '#ffffff',
                      border: `1px solid ${theme.borderColor}`,
                      overflow: 'hidden',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    {/* Sale Header synced with BatchCard style */}
                    <Box
                      sx={{
                        px: 2,
                        py: 1.25,
                        bgcolor: theme.headerBg,
                        borderBottom: `1px solid ${theme.borderColor}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              color: theme.dateColor,
                              fontSize: '0.88rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {date}
                          </Typography>
                          {isToday && (
                            <Chip
                              label="Today"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                bgcolor: '#dcfce7',
                                color: '#15803d',
                                border: 'none',
                              }}
                            />
                          )}
                          {isYesterday && (
                            <Chip
                              label="Yesterday"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                bgcolor: '#e0f2fe',
                                color: '#0369a1',
                                border: 'none',
                              }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: '#334155',
                              fontSize: '0.72rem',
                              bgcolor: '#ffffff',
                              border: `1px solid ${theme.borderColor}`,
                              px: 0.75,
                              py: 0.2,
                              borderRadius: '4px',
                            }}
                          >
                            Sale #{sale.id}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: theme.timeColor, fontWeight: 500, fontSize: '0.72rem' }}
                          >
                            {time}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          textAlign: 'right',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexShrink: 0,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 800, color: theme.amountColor, fontSize: '0.92rem' }}
                        >
                          ₹{netAmount.toFixed(2)}
                        </Typography>
                        <Chip
                          label={sale.paymentMethod}
                          size="small"
                          sx={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            height: 20,
                            bgcolor: theme.paymentBg,
                            color: '#334155',
                            borderRadius: '4px',
                            border: `1px solid #cbd5e1`,
                            px: 0.25,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Sale Items Table */}
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell
                              sx={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#64748b',
                                textTransform: 'uppercase',
                                py: 0.75,
                                px: 1.5,
                              }}
                            >
                              Item
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#64748b',
                                textTransform: 'uppercase',
                                py: 0.75,
                                px: 1.5,
                              }}
                            >
                              Qty
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#64748b',
                                textTransform: 'uppercase',
                                py: 0.75,
                                px: 1.5,
                              }}
                            >
                              Price
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sale.items.map((item) => (
                            <TableRow key={item.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                              <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#1e293b', py: 0.75, px: 1.5 }}>
                                {item.batch?.product?.name || 'Unknown Item'}
                                {item.isWholesale && (
                                  <Chip
                                    label="Wholesale"
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.6rem',
                                      fontWeight: 700,
                                      ml: 0.75,
                                      bgcolor: '#e0f2fe',
                                      color: '#0369a1',
                                      border: 'none',
                                    }}
                                  />
                                )}
                                {item.isOnSale && (
                                  <Chip
                                    label="Offer"
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.6rem',
                                      fontWeight: 700,
                                      ml: 0.75,
                                      bgcolor: '#fef3c7',
                                      color: '#b45309',
                                      border: 'none',
                                    }}
                                  />
                                )}
                                {item.returnedQuantity > 0 && (
                                  <Chip
                                    label={`-${item.returnedQuantity} ret.`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, ml: 0.75 }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', py: 0.75, px: 1.5 }}>
                                {item.returnedQuantity > 0 ? (
                                  <Box component="span">
                                    <Box
                                      component="span"
                                      sx={{ textDecoration: 'line-through', opacity: 0.5, mr: 0.5 }}
                                    >
                                      {item.quantity}
                                    </Box>
                                    {item.quantity - item.returnedQuantity}
                                  </Box>
                                ) : (
                                  item.quantity
                                )}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', py: 0.75, px: 1.5 }}>
                                ₹{item.sellingPrice}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                );
              })
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      )}
    </InventoryPanelShell>
  );
};

export default CustomerDetailPanel;
