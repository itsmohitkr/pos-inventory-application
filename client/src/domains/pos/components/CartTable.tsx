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
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import {
  getBatchCodeDisplay,
  getCartItemDiscount,
  getCartItemTotal,
  getCartRowId,
  shouldHighlightCartRow,
} from '@/domains/pos/components/cartTableUtils';

const ShortBatchCode = ({ batchCode }: { batchCode?: string | null }) => {
  const batchDisplay = getBatchCodeDisplay(batchCode);

  if (batchDisplay.type === 'missing') {
    return (
      <Typography variant="caption" color="text.secondary">
        {batchDisplay.label}
      </Typography>
    );
  }

  if (batchDisplay.type === 'full') {
    return (
      <Chip
        label={batchDisplay.label}
        size="small"
        variant="outlined"
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          height: '18px',
        }}
      />
    );
  }

  return (
    <Tooltip title={`Batch: ${batchDisplay.fullLabel}`} arrow placement="top">
      <Chip
        label={batchDisplay.label}
        size="small"
        variant="outlined"
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          height: '18px',
          cursor: 'help',
        }}
      />
    </Tooltip>
  );
};

interface CartTableProps {
  cart: CartItem[];
  /** Delta, not an absolute value — +1 / -1 from the stepper. */
  onUpdateQuantity: (batchId: number, change: number) => void;
  onRemoveFromCart: (batchId: number) => void;
  /** Opens the numpad to type an exact quantity. */
  onQuantityClick: (item: CartItem) => void;
  /** Batch id of the most recent addition; that row is highlighted. */
  lastAddedItemId: number | null;
}

const CartTable = ({
  cart,
  onUpdateQuantity,
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
                      {item.wholesaleEnabled && (
                        <Tooltip
                          title={`Wholesale: ₹${item.wholesalePrice} for ${item.wholesaleMinQty}+ units`}
                          arrow
                        >
                          <Chip
                            label="WHOLESALE"
                            size="small"
                            variant={item.quantity >= (item.wholesaleMinQty ?? Infinity) ? 'filled' : 'outlined'}
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              bgcolor:
                                item.quantity >= (item.wholesaleMinQty ?? Infinity) ? '#f59e0b' : 'transparent',
                              color: item.quantity >= (item.wholesaleMinQty ?? Infinity) ? 'white' : '#f59e0b',
                              borderColor: '#f59e0b',
                              borderWidth: 1.5,
                              borderRadius: '4px',
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                      <ShortBatchCode batchCode={item.batch_code} />
                      {item.isOnSale && item.sellingPrice > item.price && (
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
                      {item.wholesaleEnabled && (
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              item.quantity >= (item.wholesaleMinQty ?? Infinity) ? '#f59e0b' : 'text.secondary',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor:
                              item.quantity >= (item.wholesaleMinQty ?? Infinity)
                                ? 'rgba(245, 158, 11, 0.1)'
                                : 'transparent',
                            px: 1,
                            borderRadius: 1,
                          }}
                        >
                          {item.wholesaleMinQty}+ units at ₹{item.wholesalePrice}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        width: 'fit-content',
                        mx: 'auto',
                        opacity: item.isFree ? 0.6 : 1,
                      }}
                    >
                      {!item.isFree && (
                        <IconButton
                          size="small"
                          onClick={() => onUpdateQuantity(item.batch_id, -1)}
                          onMouseDown={(e) => e.preventDefault()}
                          color="primary"
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
                          color: 'primary.main',
                          bgcolor: 'rgba(26, 115, 232, 0.05)',
                          transition: 'all 0.2s',
                          '&:hover': !item.isFree
                            ? {
                              bgcolor: 'rgba(26, 115, 232, 0.15)',
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
                          color="primary"
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
