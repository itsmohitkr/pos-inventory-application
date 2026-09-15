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
                MRP
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Price
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Disc.
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total
              </TableCell>
              <TableCell width={40}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cart.map((item: CartItem, index: number) => {
              const totalDiscount = getCartItemDiscount(item);
              const isWholesaleConfigured = Boolean(
                item.wholesaleEnabled &&
                item.wholesaleMinQty != null &&
                item.wholesaleMinQty > 0 &&
                item.wholesalePrice != null
              );
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
                          startIcon={<FlashOnIcon sx={{ fontSize: '18px !important' }} />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.825rem',
                            fontWeight: 700,
                            py: 0.45,
                            px: 1.5,
                            minHeight: 28,
                            borderRadius: '6px',
                            bgcolor: 'transparent',
                            color: '#2563eb',
                            border: '1.5px solid #2563eb',
                            boxShadow: 'none',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#2563eb !important',
                              backgroundColor: '#2563eb !important',
                              color: '#ffffff !important',
                              borderColor: '#1d4ed8 !important',
                              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isWholesaleActive ? '1.5px solid #16a34a' : '1px solid #ddd',
                        borderRadius: 1,
                        width: 'fit-content',
                        mx: 'auto',
                        opacity: item.isFree ? 0.6 : 1,
                        bgcolor: isWholesaleActive ? 'rgba(22, 163, 74, 0.05)' : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      {!item.isFree && (
                        <IconButton
                          size="small"
                          onClick={() => onUpdateQuantity(item.batch_id, -1)}
                          onMouseDown={(e) => e.preventDefault()}
                          color={isWholesaleActive ? 'success' : 'primary'}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          minWidth: 35,
                          textAlign: 'center',
                          cursor: item.isFree ? 'default' : 'pointer',
                          px: 1,
                          py: 0.2,
                          borderRadius: 1,
                          color: isWholesaleActive ? '#15803d' : 'primary.main',
                          bgcolor: isWholesaleActive ? 'rgba(22, 163, 74, 0.12)' : 'rgba(26, 115, 232, 0.05)',
                          transition: 'all 0.2s',
                          '&:hover': !item.isFree
                            ? {
                                bgcolor: isWholesaleActive ? 'rgba(22, 163, 74, 0.22)' : 'rgba(26, 115, 232, 0.15)',
                                transform: 'scale(1.1)',
                              }
                            : {},
                        }}
                        onClick={() => !item.isFree && onQuantityClick?.(item)}
                      >
                        {item.quantity}
                      </Typography>
                      {!item.isFree && (
                        <IconButton
                          size="small"
                          onClick={() => onUpdateQuantity(item.batch_id, 1)}
                          onMouseDown={(e) => e.preventDefault()}
                          color={isWholesaleActive ? 'success' : 'primary'}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">₹{item.mrp.toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="600">
                      ₹{item.price.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error.main">
                      ₹{totalDiscount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ₹{getCartItemTotal(item).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="medium"
                      color="error"
                      onClick={() => onRemoveFromCart(item.batch_id)}
                      onMouseDown={(e) => e.preventDefault()}
                      sx={{
                        border: '1.5px solid',
                        borderColor: 'error.light',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'error.main',
                          bgcolor: 'rgba(211, 47, 47, 0.04)',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="medium" />
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
