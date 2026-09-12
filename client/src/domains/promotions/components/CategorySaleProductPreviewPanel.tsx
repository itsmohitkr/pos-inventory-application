import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  TableSortLabel,
  Checkbox,
  Stack,
  IconButton,
  Button,
} from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import type { CategorySaleProductPreview } from '@/domains/promotions/types';
import type { ProductOverride } from '@/domains/promotions/components/useCategorySaleOverrides';
import type { RowStatusFilter } from '@/domains/promotions/components/useCategorySaleProductPreview';

type SortField = keyof CategorySaleProductPreview;

interface CategorySaleProductPreviewPanelProps {
  category: string;
  previewProducts: CategorySaleProductPreview[];
  filteredProducts: CategorySaleProductPreview[];
  selectedProductIds: Set<number>;
  loadingPreview: boolean;
  previewError: string | null;
  statusFilter: RowStatusFilter;
  setStatusFilter: (filter: RowStatusFilter) => void;
  orderBy: SortField;
  order: 'asc' | 'desc';
  handleRequestSort: (property: SortField) => void;
  handleToggleProduct: (id: number) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  handleToggleSelectAll: () => void;
  summaryCounts: {
    eligible: number;
    alreadyBetter: number;
    marginProtected: number;
    overridden: number;
    noPricingData: number;
    excluded: number;
  };
  productOverrides: Map<number, ProductOverride>;
  computeOverridePreview: (
    product: CategorySaleProductPreview,
    discountPct: number
  ) => { price: number; profitAmount: number; profitMargin: number };
  openOverridePopover: (event: React.MouseEvent<HTMLElement>, product: CategorySaleProductPreview) => void;
}

/**
 * Selection controls, status-filter chips, and the color-coded product
 * preview table for CategorySaleFormDialog — the biggest chunk of that
 * dialog's original markup, split out so the dialog itself stays about the
 * sale's own fields and submission.
 */
const CategorySaleProductPreviewPanel = ({
  category,
  previewProducts,
  filteredProducts,
  selectedProductIds,
  loadingPreview,
  previewError,
  statusFilter,
  setStatusFilter,
  orderBy,
  order,
  handleRequestSort,
  handleToggleProduct,
  handleSelectAll,
  handleDeselectAll,
  isAllSelected,
  isSomeSelected,
  handleToggleSelectAll,
  summaryCounts,
  productOverrides,
  computeOverridePreview,
  openOverridePopover,
}: CategorySaleProductPreviewPanelProps) => {
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
          Product Selection & Impact Preview ({selectedProductIds.size} of {previewProducts.length} products selected)
        </Typography>
        {previewProducts.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              disabled={isAllSelected}
              sx={{ fontSize: '0.725rem', py: 0.2, px: 1, textTransform: 'none' }}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={handleDeselectAll}
              disabled={selectedProductIds.size === 0}
              sx={{ fontSize: '0.725rem', py: 0.2, px: 1, textTransform: 'none' }}
            >
              Deselect All
            </Button>
          </Box>
        )}
      </Box>

      {previewProducts.length > 0 && !loadingPreview && (
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', rowGap: 0.5, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, mr: 0.5 }}>
            View:
          </Typography>
          <Chip
            size="small"
            label={`All (${previewProducts.length})`}
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('all')}
            sx={{ fontWeight: 700, cursor: 'pointer' }}
          />
          <Chip
            size="small"
            label={`${summaryCounts.eligible} eligible`}
            variant={statusFilter === 'eligible' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter(statusFilter === 'eligible' ? 'all' : 'eligible')}
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              bgcolor: statusFilter === 'eligible' ? '#fff7ed' : 'transparent',
              borderColor: '#fdba74',
              color: '#c2410c',
            }}
          />
          {summaryCounts.alreadyBetter > 0 && (
            <Chip
              size="small"
              label={`${summaryCounts.alreadyBetter} already better priced`}
              variant={statusFilter === 'alreadyBetter' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter(statusFilter === 'alreadyBetter' ? 'all' : 'alreadyBetter')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: statusFilter === 'alreadyBetter' ? '#f1f5f9' : 'transparent',
                borderColor: '#cbd5e1',
                color: '#475569',
              }}
            />
          )}
          {summaryCounts.marginProtected > 0 && (
            <Chip
              size="small"
              label={`${summaryCounts.marginProtected} margin-protected`}
              variant={statusFilter === 'marginProtected' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter(statusFilter === 'marginProtected' ? 'all' : 'marginProtected')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: statusFilter === 'marginProtected' ? '#eef2ff' : 'transparent',
                borderColor: '#a5b4fc',
                color: '#4338ca',
              }}
            />
          )}
          {summaryCounts.overridden > 0 && (
            <Chip
              size="small"
              icon={<AdminIcon sx={{ fontSize: '0.9rem !important' }} />}
              label={`${summaryCounts.overridden} admin override${summaryCounts.overridden === 1 ? '' : 's'}`}
              variant={statusFilter === 'overridden' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter(statusFilter === 'overridden' ? 'all' : 'overridden')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: statusFilter === 'overridden' ? '#fef2f2' : 'transparent',
                borderColor: '#fca5a5',
                color: '#b91c1c',
              }}
            />
          )}
          {summaryCounts.noPricingData > 0 && (
            <Tooltip title="No stock has ever been added for these products, so there's no MRP, cost, or selling price to discount." arrow>
              <Chip
                size="small"
                label={`${summaryCounts.noPricingData} no pricing data`}
                variant={statusFilter === 'noPricingData' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter(statusFilter === 'noPricingData' ? 'all' : 'noPricingData')}
                sx={{
                  fontWeight: 700,
                  cursor: 'pointer',
                  bgcolor: statusFilter === 'noPricingData' ? '#fefce8' : 'transparent',
                  borderColor: '#fde047',
                  color: '#a16207',
                }}
              />
            </Tooltip>
          )}
          {summaryCounts.excluded > 0 && (
            <Chip
              size="small"
              label={`${summaryCounts.excluded} excluded`}
              variant={statusFilter === 'excluded' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter(statusFilter === 'excluded' ? 'all' : 'excluded')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: statusFilter === 'excluded' ? '#f8fafc' : 'transparent',
                borderColor: '#e2e8f0',
                color: '#64748b',
              }}
            />
          )}
        </Stack>
      )}

      <Paper
        variant="outlined"
        sx={{
          height: 480,
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Overlay Spinner while updating preview */}
        {loadingPreview && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(2px)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={32} sx={{ color: '#0f172a' }} />
          </Box>
        )}

        {previewError ? (
          <Alert severity="warning" sx={{ m: 2 }}>
            {previewError}
          </Alert>
        ) : previewProducts.length === 0 && !loadingPreview ? (
          <Box sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              No products found in category "{category}".
            </Typography>
          </Box>
        ) : filteredProducts.length === 0 && !loadingPreview ? (
          <Box sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              No products match this filter.
            </Typography>
            <Button size="small" onClick={() => setStatusFilter('all')} sx={{ mt: 1, textTransform: 'none' }}>
              Clear filter
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ flex: 1, height: '100%' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                {/* Top Group Header Row */}
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#334155',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderRight: '1px solid #cbd5e1',
                      py: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    1. Product Baseline
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{
                      bgcolor: '#ccfbf1',
                      color: '#0f766e',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderRight: '1px solid #99f6e4',
                      py: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    2. Vendor Discount
                  </TableCell>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{
                      bgcolor: '#e0e7ff',
                      color: '#3730a3',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderRight: '1px solid #c7d2fe',
                      py: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    3. Current Store Pricing & Profit
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{
                      bgcolor: '#ffedd5',
                      color: '#9a3412',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderRight: '1px solid #fed7aa',
                      py: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    4. Proposed Category Sale
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{
                      bgcolor: '#dcfce7',
                      color: '#166534',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      py: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    5. Profitability During Sale
                  </TableCell>
                </TableRow>

                {/* Sub-Header Column Titles with Sorting */}
                <TableRow>
                  {/* Group 1 Columns */}
                  <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc', width: 48 }}>
                    <Checkbox
                      size="small"
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={handleToggleSelectAll}
                      disabled={loadingPreview || previewProducts.length === 0}
                    />
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                    >
                      Product Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'mrp'}
                      direction={orderBy === 'mrp' ? order : 'asc'}
                      onClick={() => handleRequestSort('mrp')}
                    >
                      MRP
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>
                    <TableSortLabel
                      active={orderBy === 'costPrice'}
                      direction={orderBy === 'costPrice' ? order : 'asc'}
                      onClick={() => handleRequestSort('costPrice')}
                    >
                      Cost Price
                    </TableSortLabel>
                  </TableCell>

                  {/* Group 2 Columns */}
                  <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 700, color: '#0f766e' }}>
                    <TableSortLabel
                      active={orderBy === 'vendorDiscountAmount'}
                      direction={orderBy === 'vendorDiscountAmount' ? order : 'asc'}
                      onClick={() => handleRequestSort('vendorDiscountAmount')}
                    >
                      Vendor Discount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 700, color: '#0f766e', borderRight: '1px solid #ccfbf1' }}>
                    <TableSortLabel
                      active={orderBy === 'vendorDiscountPercentage'}
                      direction={orderBy === 'vendorDiscountPercentage' ? order : 'asc'}
                      onClick={() => handleRequestSort('vendorDiscountPercentage')}
                    >
                      Vendor %
                    </TableSortLabel>
                  </TableCell>

                  {/* Group 3 Columns */}
                  <TableCell align="right" sx={{ bgcolor: '#f5f3ff', fontWeight: 700, color: '#4338ca' }}>
                    <TableSortLabel
                      active={orderBy === 'currentSellingPrice'}
                      direction={orderBy === 'currentSellingPrice' ? order : 'asc'}
                      onClick={() => handleRequestSort('currentSellingPrice')}
                    >
                      Current Selling Price
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f3ff', fontWeight: 700, color: '#4338ca' }}>
                    <TableSortLabel
                      active={orderBy === 'currentCustomerDiscountPercentage'}
                      direction={orderBy === 'currentCustomerDiscountPercentage' ? order : 'asc'}
                      onClick={() => handleRequestSort('currentCustomerDiscountPercentage')}
                    >
                      Regular Disc %
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f3ff', fontWeight: 700, color: '#4338ca' }}>
                    <TableSortLabel
                      active={orderBy === 'regularProfitAmount'}
                      direction={orderBy === 'regularProfitAmount' ? order : 'asc'}
                      onClick={() => handleRequestSort('regularProfitAmount')}
                    >
                      Regular Profit
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f3ff', fontWeight: 700, color: '#4338ca', borderRight: '1px solid #ddd6fe' }}>
                    <TableSortLabel
                      active={orderBy === 'regularProfitMargin'}
                      direction={orderBy === 'regularProfitMargin' ? order : 'asc'}
                      onClick={() => handleRequestSort('regularProfitMargin')}
                    >
                      Regular Margin %
                    </TableSortLabel>
                  </TableCell>

                  {/* Group 4 Columns */}
                  <TableCell align="right" sx={{ bgcolor: '#fff7ed', fontWeight: 700, color: '#ea580c' }}>
                    <TableSortLabel
                      active={orderBy === 'discountPercentage'}
                      direction={orderBy === 'discountPercentage' ? order : 'asc'}
                      onClick={() => handleRequestSort('discountPercentage')}
                    >
                      Sale Disc %
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#fff7ed', fontWeight: 700, color: '#ea580c', borderRight: '1px solid #ffedd5' }}>
                    <TableSortLabel
                      active={orderBy === 'newSellingPrice'}
                      direction={orderBy === 'newSellingPrice' ? order : 'asc'}
                      onClick={() => handleRequestSort('newSellingPrice')}
                    >
                      New Selling Price
                    </TableSortLabel>
                  </TableCell>

                  {/* Group 5 Columns */}
                  <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 700, color: '#15803d' }}>
                    <TableSortLabel
                      active={orderBy === 'profitAmount'}
                      direction={orderBy === 'profitAmount' ? order : 'asc'}
                      onClick={() => handleRequestSort('profitAmount')}
                    >
                      Sale Profit
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 700, color: '#15803d' }}>
                    <TableSortLabel
                      active={orderBy === 'profitMargin'}
                      direction={orderBy === 'profitMargin' ? order : 'asc'}
                      onClick={() => handleRequestSort('profitMargin')}
                    >
                      Sale Margin %
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.has(p.id);
                  const override = productOverrides.get(p.id);
                  const overrideResult = override ? computeOverridePreview(p, override.discountPercentage) : null;
                  const displayPrice = overrideResult ? overrideResult.price : p.newSellingPrice;
                  const displayProfitAmount = overrideResult ? overrideResult.profitAmount : p.profitAmount;
                  const displayProfitMargin = overrideResult ? overrideResult.profitMargin : p.profitMargin;
                  const isNegativeMargin = isSelected ? displayProfitMargin < 0 : p.regularProfitMargin < 0;
                  const canOverride =
                    isSelected && p.hasPricingData && (!!override || p.noAdditionalDiscount || p.marginProtected);
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{
                        bgcolor: !isSelected ? '#f8fafc' : isNegativeMargin ? '#fef2f2' : 'inherit',
                        opacity: !isSelected ? 0.65 : 1,
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleToggleProduct(p.id)}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {p.name}
                        {!p.hasPricingData && (
                          <Tooltip title="No stock has ever been added for this product — there's no MRP, cost, or selling price yet." arrow>
                            <Chip
                              label="No stock"
                              size="small"
                              sx={{ ml: 1, height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#fefce8', color: '#a16207' }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="right">{p.hasPricingData ? p.mrp.toFixed(2) : '—'}</TableCell>
                      <TableCell align="right" sx={{ borderRight: '1px solid #e2e8f0' }}>
                        {p.hasPricingData ? p.costPrice.toFixed(2) : '—'}
                      </TableCell>

                      {/* Group 2 Data: Vendor Discount */}
                      <TableCell align="right" sx={{ bgcolor: isSelected ? '#f0fdf4' : 'inherit', color: '#0f766e', fontWeight: 600 }}>
                        {p.hasPricingData ? p.vendorDiscountAmount.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: isSelected ? '#f0fdf4' : 'inherit', color: '#0f766e', borderRight: '1px solid #e2e8f0' }}>
                        {p.hasPricingData ? `${p.vendorDiscountPercentage}%` : '—'}
                      </TableCell>

                      {/* Group 3 Data: Regular Store Pricing & Profit */}
                      <TableCell align="right" sx={{ bgcolor: isSelected ? '#f5f3ff' : 'inherit', fontWeight: 600 }}>
                        {p.hasPricingData ? p.currentSellingPrice.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: isSelected ? '#f5f3ff' : 'inherit', color: '#4338ca', fontWeight: 600 }}>
                        {p.hasPricingData ? `${p.currentCustomerDiscountPercentage}%` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: isSelected ? '#f5f3ff' : 'inherit', color: '#4338ca', fontWeight: 600 }}>
                        {p.hasPricingData ? p.regularProfitAmount.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: isSelected ? '#f5f3ff' : 'inherit', borderRight: '1px solid #e2e8f0' }}>
                        {p.hasPricingData ? (
                          <Chip
                            label={`${p.regularProfitMargin}%`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem', borderColor: '#a5b4fc', color: '#4338ca' }}
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      {/* Group 4 Data: Proposed Category Sale */}
                      <TableCell align="right" sx={{ bgcolor: isSelected ? '#fff7ed' : 'inherit', color: isSelected ? '#ea580c' : '#64748b', fontWeight: 700 }}>
                        {!isSelected ? (
                          'Excluded'
                        ) : !p.hasPricingData ? (
                          <Tooltip title="No stock has ever been added for this product, so there's nothing to discount." arrow>
                            <span>No pricing data</span>
                          </Tooltip>
                        ) : override ? (
                          <Tooltip title={`Admin override: ${override.reason}`} arrow>
                            <span>{override.discountPercentage}% (override)</span>
                          </Tooltip>
                        ) : p.noAdditionalDiscount ? (
                          <Tooltip title="This product's current regular price is already lower than (or equal to) what this category discount would offer, so it keeps its regular price." arrow>
                            <span>No extra discount</span>
                          </Tooltip>
                        ) : (
                          `${p.discountPercentage}% OFF`
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: isSelected ? '#fff7ed' : 'inherit', fontWeight: 800, color: isSelected ? '#c2410c' : '#475569', borderRight: '1px solid #e2e8f0' }}>
                        {!p.hasPricingData ? '—' : isSelected ? displayPrice.toFixed(2) : p.currentSellingPrice.toFixed(2)}
                      </TableCell>

                      {/* Group 5 Data: Sale Profitability */}
                      <TableCell
                        align="right"
                        sx={{
                          bgcolor: !isSelected ? 'inherit' : isNegativeMargin ? '#fee2e2' : '#f0fdf4',
                          fontWeight: 700,
                          color: !isSelected ? '#475569' : isNegativeMargin ? '#dc2626' : '#15803d',
                        }}
                      >
                        {!p.hasPricingData
                          ? '—'
                          : isSelected
                            ? displayProfitAmount.toFixed(2)
                            : p.regularProfitAmount.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: !isSelected ? 'inherit' : isNegativeMargin ? '#fee2e2' : '#f0fdf4' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {!p.hasPricingData ? (
                            <Chip label="—" size="small" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                          ) : (
                            <Chip
                              label={`${isSelected ? displayProfitMargin : p.regularProfitMargin}%`}
                              size="small"
                              color={!isSelected ? 'default' : isNegativeMargin ? 'error' : 'success'}
                              variant={!isSelected ? 'outlined' : isNegativeMargin ? 'filled' : 'outlined'}
                              sx={{ height: 22, fontWeight: 700 }}
                            />
                          )}
                          {isSelected && override && (
                            <Tooltip title={`Admin override: ${override.reason}`} arrow>
                              <Chip
                                icon={<AdminIcon sx={{ fontSize: '0.9rem !important' }} />}
                                label="Admin override"
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, borderColor: '#fca5a5', color: '#b91c1c' }}
                              />
                            </Tooltip>
                          )}
                          {isSelected && !override && p.marginProtected && (
                            <Tooltip title="The discount was capped at your cost price to avoid selling this product at a loss." arrow>
                              <Chip
                                label="Margin protected"
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, borderColor: '#a5b4fc', color: '#4338ca' }}
                              />
                            </Tooltip>
                          )}
                          {canOverride && (
                            <Tooltip title={override ? 'Edit admin override' : 'Admin: override this discount'} arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => openOverridePopover(e, p)}
                                sx={{ p: 0.25, color: override ? '#b91c1c' : '#94a3b8' }}
                              >
                                <AdminIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default CategorySaleProductPreviewPanel;
