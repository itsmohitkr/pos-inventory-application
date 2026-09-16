import type { CartItem } from '@/domains/pos/types';
import React, { useEffect, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Button,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  FlashOn as FlashOnIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import {
  getCartItemDiscount,
  getCartItemTotal,
  getCartRowId,
  isWholesaleApplicable,
  shouldHighlightCartRow,
} from '@/domains/pos/components/cartTableUtils';

interface CartTableProps {
  cart: CartItem[];
  /** Delta, not an absolute value — +1 / -1 from the stepper. */
  onUpdateQuantity: (batchId: number, change: number) => void;
  /** Sets an exact quantity (e.g. applying wholesale minimum quantity). */
  onSetQuantity?: (batchId: number, quantity: number) => void;
  onRemoveFromCart: (batchId: number) => void;
  /** Opens the numpad to type an exact quantity. */
  onQuantityClick: (item: CartItem) => void;
  /** Batch id of the most recent addition; that row is highlighted. */
  lastAddedItemId: number | null;
}

const CartTable = ({
  cart,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveFromCart,
  onQuantityClick,
  lastAddedItemId,
}: CartTableProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lastAddedItemId) {
      const rowElement = document.getElementById(getCartRowId(lastAddedItemId));
      if (rowElement) {
        rowElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [lastAddedItemId]);

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TableContainer
        ref={scrollContainerRef}
        sx={{ flexGrow: 1, overflowY: 'auto', borderTop: '1px solid rgba(16, 24, 40, 0.06)' }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40} sx={{ fontWeight: 'bold' }}>
                S.No
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                Qty
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                MRP (₹)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Price (₹)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Disc. (₹)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total (₹)
              </TableCell>
              <TableCell width={62} align="center" sx={{ pr: 2 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cart.map((item: CartItem, index: number) => {
              const totalDiscount = getCartItemDiscount(item);
              const isWholesaleConfigured = isWholesaleApplicable(item);
              const isWholesaleActive = Boolean(
                isWholesaleConfigured &&
                item.quantity >= (item.wholesaleMinQty ?? Infinity)
              );

              return (
                <TableRow
                  key={item.batch_id}
                  id={getCartRowId(item.batch_id)}
                  hover
                  sx={{
                    backgroundColor: shouldHighlightCartRow(item.batch_id, lastAddedItemId)
                      ? 'rgba(76, 175, 80, 0.15)'
                      : 'inherit',
                    transition: 'background-color 0.5s ease',
                  }}
                >
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="600" color="text.secondary">
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight="600">
                        {item.name}
                      </Typography>
                      {item.isFree && (
                        <Chip
                          label="GIFT"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            bgcolor: '#22ab7dff',
                            color: 'white',
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      {item.isOnSale && (
                        <Chip
                          label="SALE OFFER"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            bgcolor: '#7c3aed',
                            color: 'white',
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      {isWholesaleConfigured && (
                        <Chip
                          icon={
                            isWholesaleActive ? (
                              <CheckIcon sx={{ fontSize: '13px !important', color: 'white !important' }} />
                            ) : undefined
                          }
                          label={isWholesaleActive ? 'WHOLESALE APPLIED' : 'WHOLESALE'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            bgcolor: isWholesaleActive ? '#16a34a' : '#f59e0b',
                            color: 'white',
                            borderRadius: '4px',
                            '& .MuiChip-label': { px: 1 },
                            '& .MuiChip-icon': { ml: '4px', mr: '-4px' },
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 0.75 }}>
                      {item.isOnSale && !isWholesaleActive && item.sellingPrice > item.price && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: 'rgba(124, 58, 237, 0.1)',
                            px: 1,
                            borderRadius: 1,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{ textDecoration: 'line-through', color: '#64748b' }}
                          >
                            ₹{item.sellingPrice.toFixed(2)}
                          </Box>
                          <Box component="span" sx={{ color: '#7c3aed' }}>
                            ₹{item.price.toFixed(2)}
                          </Box>
                        </Typography>
                      )}
                      {isWholesaleActive && item.sellingPrice > item.price && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: 'rgba(22, 163, 74, 0.1)',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{ textDecoration: 'line-through', color: '#64748b' }}
                          >
                            ₹{item.sellingPrice.toFixed(2)}
                          </Box>
                          <Box component="span" sx={{ color: '#15803d', fontWeight: 800 }}>
                            ₹{item.price.toFixed(2)}/unit
                          </Box>
                        </Typography>
                      )}
                      {isWholesaleConfigured && !isWholesaleActive && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={item.isFree || item.max_quantity < (item.wholesaleMinQty ?? 0) || !onSetQuantity}
                          onClick={() => onSetQuantity?.(item.batch_id, item.wholesaleMinQty!)}
                          startIcon={<FlashOnIcon sx={{ fontSize: '13px !important' }} />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            py: 0.2,
                            px: 1,
                            minHeight: 22,
                            height: 22,
                            borderRadius: '4px',
                            bgcolor: 'transparent',
                            color: '#2563eb',
                            border: '1px solid #2563eb',
                            boxShadow: 'none',
                            transition: 'all 0.15s ease',
                            '& .MuiButton-startIcon': {
                              mr: 0.5,
                              ml: -0.25,
                            },
                            '&:hover': {
                              bgcolor: '#2563eb !important',
                              backgroundColor: '#2563eb !important',
                              color: '#ffffff !important',
                              borderColor: '#1d4ed8 !important',
                              boxShadow: '0 1px 4px rgba(37, 99, 235, 0.25)',
                              '& .MuiButton-startIcon': {
                                color: '#ffffff !important',
                              },
                            },
                            '&.Mui-disabled': {
                              borderColor: '#cbd5e1 !important',
                              color: '#94a3b8 !important',
                              bgcolor: 'transparent !important',
                            },
                          }}
                        >
                          Add {item.wholesaleMinQty} Units (₹{item.wholesalePrice?.toFixed(2)} / unit)
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        p: 0.25,
                        borderRadius: '8px',
                        border: '1.5px solid',
                        borderColor: isWholesaleActive ? '#16a34a' : '#e2e8f0',
                        bgcolor: isWholesaleActive ? 'rgba(22, 163, 74, 0.04)' : '#f8fafc',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                        opacity: item.isFree ? 0.7 : 1,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': !item.isFree
                          ? {
                              borderColor: isWholesaleActive ? '#15803d' : '#cbd5e1',
                              bgcolor: isWholesaleActive ? 'rgba(22, 163, 74, 0.07)' : '#ffffff',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                            }
                          : {},
                      }}
                    >
                      {!item.isFree && (
                        <IconButton
                          size="small"
                          aria-label="Decrease quantity"
                          onClick={() => onUpdateQuantity(item.batch_id, -1)}
                          onMouseDown={(e) => e.preventDefault()}
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '6px',
                            color: isWholesaleActive ? '#16a34a' : '#475569',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: isWholesaleActive
                                ? 'rgba(22, 163, 74, 0.12)'
                                : 'rgba(15, 23, 42, 0.06)',
                              color: isWholesaleActive ? '#15803d' : '#0f172a',
                            },
                            '&:active': {
                              transform: 'scale(0.92)',
                            },
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                      <Box
                        component="button"
                        type="button"
                        aria-label="Set quantity"
                        title={!item.isFree ? 'Click to set quantity' : undefined}
                        onClick={() => !item.isFree && onQuantityClick?.(item)}
                        onMouseDown={(e) => e.preventDefault()}
                        sx={{
                          border: 'none',
                          background: 'none',
                          cursor: item.isFree ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 34,
                          height: 26,
                          mx: 0.25,
                          px: 0.75,
                          borderRadius: '5px',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          color: isWholesaleActive ? '#15803d' : '#0f172a',
                          bgcolor: isWholesaleActive
                            ? 'rgba(22, 163, 74, 0.12)'
                            : 'rgba(15, 23, 42, 0.05)',
                          transition: 'all 0.15s ease',
                          ...(!item.isFree && {
                            '&:hover': {
                              bgcolor: isWholesaleActive
                                ? 'rgba(22, 163, 74, 0.22)'
                                : 'rgba(15, 23, 42, 0.1)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                            },
                            '&:active': {
                              transform: 'scale(0.96)',
                            },
                          }),
                        }}
                      >
                        {item.quantity}
                      </Box>
                      {!item.isFree && (
                        <IconButton
                          size="small"
                          aria-label="Increase quantity"
                          onClick={() => onUpdateQuantity(item.batch_id, 1)}
                          onMouseDown={(e) => e.preventDefault()}
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '6px',
                            color: isWholesaleActive ? '#16a34a' : '#475569',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: isWholesaleActive
                                ? 'rgba(22, 163, 74, 0.12)'
                                : 'rgba(15, 23, 42, 0.06)',
                              color: isWholesaleActive ? '#15803d' : '#0f172a',
                            },
                            '&:active': {
                              transform: 'scale(0.92)',
                            },
                          }}
                        >
                          <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{item.mrp.toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="600">
                      {item.price.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error.main">
                      {totalDiscount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {getCartItemTotal(item).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ pr: 2, pl: 1 }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveFromCart(item.batch_id)}
                      onMouseDown={(e) => e.preventDefault()}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                        border: '1.5px solid',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        color: 'error.main',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'error.main',
                          bgcolor: 'rgba(239, 68, 68, 0.18)',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 21 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {cart.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                  <ShoppingCartIcon sx={{ fontSize: 60, color: 'rgba(11, 29, 57, 0.2)', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Order is empty
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Search an item to begin
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CartTable;
