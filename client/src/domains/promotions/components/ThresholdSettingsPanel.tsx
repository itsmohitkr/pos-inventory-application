import React, { useState, useMemo } from 'react';
import type { PromoSettings, PromoThresholdConfig } from '@/domains/promotions/types';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip,
  Stack,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import InventoryPanelShell from '@/domains/inventory/components/InventoryPanelShell';
import { useResizablePanel } from '@/shared/hooks/useResizablePanel';

interface ThresholdSettingsPanelProps {
  promoSettings: PromoSettings;
  setPromoSettings: React.Dispatch<React.SetStateAction<PromoSettings>>;
  /** Flattened category paths, used for the allow/disallow group pickers. */
  categories: string[];
  onToggleEnabled?: (enabled: boolean) => void;
  onAddThreshold: (customRule?: Partial<PromoThresholdConfig>) => void;
  onUpdateConfig: (
    threshold: number,
    field: keyof PromoThresholdConfig,
    value: unknown,
    autoSave?: boolean
  ) => void;
  onSaveRuleConfig?: (
    originalThreshold: number,
    updatedRule: PromoThresholdConfig
  ) => void;
  onRemoveThreshold: (threshold: number) => void;
}

const columnTypographySx = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#334155',
};

const headCellSx = {
  fontWeight: 700,
  color: '#475569',
  bgcolor: '#f8fafc',
  py: 1.25,
  px: 1.5,
  borderBottom: '1px solid #e2e8f0',
  fontSize: '0.75rem',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
};

const sectionHeaderSx = {
  fontWeight: 700,
  color: '#64748b',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  fontSize: '0.72rem',
  display: 'block',
  mb: 1.5,
};

const fieldLabelSx = {
  fontWeight: 500,
  color: '#334155',
  display: 'block',
  mb: 0.75,
  fontSize: '0.8rem',
};

const ThresholdSettingsPanel = ({
  promoSettings,
  setPromoSettings,
  categories,
  onToggleEnabled,
  onAddThreshold,
  onUpdateConfig,
  onSaveRuleConfig,
  onRemoveThreshold,
}: ThresholdSettingsPanelProps) => {
  const [editingThreshold, setEditingThreshold] = useState<number | null>(null);
  const [draftConfig, setDraftConfig] = useState<PromoThresholdConfig | null>(null);
  const [sidebarError, setSidebarError] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [addFormThreshold, setAddFormThreshold] = useState('');
  const [addFormProfit, setAddFormProfit] = useState('20');
  const [addFormMaxGifts, setAddFormMaxGifts] = useState('5');
  const [addFormError, setAddFormError] = useState('');
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null);

  const { width: rightPanelWidth, isResizing, startResizing } = useResizablePanel({
    storageKey: 'promotions-threshold-panel-width',
    defaultWidth: 400,
    min: 340,
    maxRatio: 0.5,
  });

  const configs = useMemo(() => promoSettings.config || [], [promoSettings.config]);
  const sortedConfigs = useMemo(
    () => [...configs].sort((a, b) => a.threshold - b.threshold),
    [configs]
  );

  const editingConfig = configs.find(
    (c: PromoThresholdConfig) => c.threshold === editingThreshold
  );

  // Close the sidebar if the rule being edited is removed elsewhere (e.g. deleted from another
  // tab/session). Adjusted during render, React's documented pattern for state that depends on
  // a prop, rather than in an effect — every code path that sets editingThreshold to a non-null
  // value already sets draftConfig in that same call, so no separate resync is needed here.
  if (editingThreshold !== null && !editingConfig) {
    setEditingThreshold(null);
    setDraftConfig(null);
    setSidebarError('');
  }

  const updateDraft = <K extends keyof PromoThresholdConfig>(
    field: K,
    value: PromoThresholdConfig[K]
  ) => {
    setDraftConfig((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleRowClick = (config: PromoThresholdConfig) => {
    setSidebarError('');
    if (editingThreshold === config.threshold) {
      setEditingThreshold(null);
      setDraftConfig(null);
    } else {
      setEditingThreshold(config.threshold);
      setDraftConfig({ ...config });
    }
  };

  const handleCloseSidebar = () => {
    setEditingThreshold(null);
    setDraftConfig(null);
    setSidebarError('');
  };

  const handleSaveChanges = () => {
    if (!draftConfig || editingThreshold === null) return;

    if (!draftConfig.threshold || draftConfig.threshold <= 0) {
      setSidebarError('Please enter a valid minimum order value greater than 0.');
      return;
    }

    const isDuplicate = configs.some(
      (c: PromoThresholdConfig) =>
        c.threshold === draftConfig.threshold && c.threshold !== editingThreshold
    );
    if (isDuplicate) {
      setSidebarError(`A rule for ₹${draftConfig.threshold.toLocaleString()} already exists.`);
      return;
    }

    setSidebarError('');
    if (onSaveRuleConfig) {
      onSaveRuleConfig(editingThreshold, draftConfig);
    } else {
      const updated: PromoSettings = {
        ...promoSettings,
        config: (promoSettings.config || [])
          .map((c) => (c.threshold === editingThreshold ? { ...draftConfig } : c))
          .sort((a, b) => a.threshold - b.threshold),
      };
      setPromoSettings(updated);
    }
    setEditingThreshold(draftConfig.threshold);
  };

  const handleOpenAddDialog = () => {
    setAddFormThreshold('');
    setAddFormProfit('20');
    setAddFormMaxGifts('5');
    setAddFormError('');
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setAddFormError('');
  };

  const handleDialogSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(addFormThreshold, 10);
    if (isNaN(val) || val <= 0) {
      setAddFormError('Please enter a valid order subtotal greater than 0.');
      return;
    }
    if (configs.some((c: PromoThresholdConfig) => c.threshold === val)) {
      setAddFormError(`A rule for ₹${val.toLocaleString()} already exists.`);
      return;
    }
    const profitVal = parseFloat(addFormProfit);
    const maxGiftsVal = parseInt(addFormMaxGifts, 10);

    const newRule: PromoThresholdConfig = {
      threshold: val,
      isActive: true,
      profitPercentage: !isNaN(profitVal) && profitVal >= 0 ? profitVal : 20,
      minCostPrice: 0,
      maxCostPrice: null,
      allowedGroups: [],
      disallowedGroups: [],
      sortBySales: 'none',
      maxGiftsToShow: !isNaN(maxGiftsVal) && maxGiftsVal > 0 ? maxGiftsVal : 5,
    };

    onAddThreshold(newRule);
    setEditingThreshold(val);
    setDraftConfig(newRule);
    setOpenAddDialog(false);
  };

  const handleRemove = (threshold: number) => {
    if (editingThreshold === threshold) {
      setEditingThreshold(null);
      setDraftConfig(null);
    }
    onRemoveThreshold(threshold);
  };

  const handleConfirmRemove = () => {
    if (ruleToDelete !== null) {
      handleRemove(ruleToDelete);
      setRuleToDelete(null);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 1.5,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Main Content Area (Table + Settings) */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 0,
          p: 2.5,
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          height: '100%',
        }}
      >
        {/* Header with Title and Auto-Saved Status */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            gap: 1.5,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SettingsIcon sx={{ color: '#0b1d39' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39' }}>
              Order Threshold Promotions
            </Typography>
          </Box>
          <Chip
            icon={<CheckCircleIcon sx={{ '&&': { color: '#10b981', fontSize: 16 } }} />}
            label="Auto-saved"
            size="small"
            sx={{
              bgcolor: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 26,
            }}
          />
        </Box>

        {/* Enable Automated Gifts Section Card */}
        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '8px', border: '1px solid #e2e8f0', mb: 2.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={promoSettings.enabled}
                onChange={(e) => {
                  if (onToggleEnabled) {
                    onToggleEnabled(e.target.checked);
                  } else {
                    setPromoSettings({ ...promoSettings, enabled: e.target.checked });
                  }
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10b981',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                Enable Automated Gifts
              </Typography>
            }
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500, fontSize: '0.85rem', maxWidth: 650 }}
          >
            When enabled, customers will receive a free product from eligible categories when their order
            subtotal reaches one of the thresholds defined below.
          </Typography>
        </Box>

        {/* Threshold Rules Action Bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: '#475569',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
            }}
          >
            THRESHOLD RULES
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{
              bgcolor: '#0b1d39',
              '&:hover': { bgcolor: '#1e293b' },
              borderRadius: '8px',
              px: 2,
              height: 36,
              fontWeight: 600,
              fontSize: '0.82rem',
              textTransform: 'none',
              boxShadow: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Add new rule
          </Button>
        </Box>

        {/* Table Container with Inventory UI consistency & custom thin scrollbar */}
        <TableContainer
          sx={{
            flex: 1,
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'auto',
            overflowX: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
            '&::-webkit-scrollbar': {
              height: '6px',
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#94a3b8',
            },
          }}
        >
          <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', width: '100%', minWidth: '700px' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0' }}>
                <TableCell sx={{ ...headCellSx, width: '6%', minWidth: '55px' }}>
                  S.NO.
                </TableCell>
                <TableCell align="center" sx={{ ...headCellSx, width: '10%', minWidth: '75px' }}>
                  STATUS
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: '26%', minWidth: '130px' }}>
                  MIN ORDER (₹)
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: '20%', minWidth: '110px' }}>
                  PROFIT LIMIT
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: '18%', minWidth: '100px' }}>
                  MAX GIFTS
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: '20%', minWidth: '120px' }}>
                  GROUPS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedConfigs.map((config, idx) => {
                const isSelected = editingThreshold === config.threshold;
                return (
                  <TableRow
                    key={config.threshold}
                    hover
                    onClick={() => handleRowClick(config)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Edit rule for threshold ${config.threshold}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(config);
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'rgba(11, 29, 57, 0.08)' : 'transparent',
                      '& td': { px: 1.5 },
                      '&:hover': {
                        bgcolor: isSelected ? 'rgba(11, 29, 57, 0.12)' : '#f8fafc',
                      },
                      '&:focus-visible': {
                        outline: '2px solid #0b1d39',
                        outlineOffset: '-2px',
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        py: 1.25,
                        px: 1.5,
                        ...columnTypographySx,
                        width: '6%',
                        minWidth: '55px',
                        whiteSpace: 'nowrap',
                        borderLeft: isSelected ? '3px solid #0b1d39' : '3px solid transparent',
                      }}
                    >
                      {idx + 1}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 1.25, px: 1.5 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        size="small"
                        checked={config.isActive !== false}
                        onChange={(e) =>
                          onUpdateConfig(config.threshold, 'isActive', e.target.checked, true)
                        }
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#10b981',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: '#0b1d39', fontSize: '0.85rem' }}
                      >
                        ₹{config.threshold.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        <Typography variant="body2" sx={{ ...columnTypographySx, fontWeight: 600 }}>
                          {config.profitPercentage}%
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Typography variant="body2" sx={columnTypographySx}>
                        {config.maxGiftsToShow} Products
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {(config.allowedGroups?.length ?? 0) > 0 ? (
                          <Chip
                            label={`${config.allowedGroups?.length} Groups`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: '#f0f9ff',
                              color: '#0369a1',
                            }}
                          />
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.75rem' }}
                          >
                            All products
                          </Typography>
                        )}
                        {(config.disallowedGroups?.length ?? 0) > 0 && (
                          <Chip
                            label={`-${config.disallowedGroups?.length}`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: '#fef2f2',
                              color: '#991b1b',
                            }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {configs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      No thresholds defined
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.5, display: 'block' }}
                    >
                      Add a minimum order value above to start configuring gift tiers
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Resizer Slider Handle (Matching Inventory Card 2 & Card 3) */}
      {editingConfig && draftConfig && (
        <Box
          onMouseDown={startResizing}
          sx={{
            display: { xs: 'none', lg: 'flex' },
            width: '12px',
            mx: -1.5,
            cursor: 'col-resize',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            flexShrink: 0,
            '&:hover .handle': {
              bgcolor: '#0b1d39',
              width: '4px',
            },
          }}
        >
          <Box
            className="handle"
            sx={{
              width: '2px',
              height: '60px',
              bgcolor: isResizing ? '#0b1d39' : '#cbd5e1',
              borderRadius: '4px',
              transition: 'all 0.2s',
              ...(isResizing && { width: '4px' }),
            }}
          />
        </Box>
      )}

      {/* Right-Hand Configuration Sidebar Panel */}
      {editingConfig && draftConfig && (
        <Box
          sx={{
            width: { xs: '100%', lg: rightPanelWidth },
            minWidth: { lg: 340 },
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          }}
        >
          <InventoryPanelShell
            title={`Threshold Rule: ₹${(draftConfig.threshold || 0).toLocaleString()}`}
            headerRight={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography
                  component="button"
                  type="button"
                  onClick={() => setRuleToDelete(draftConfig.threshold)}
                  sx={{
                    background: 'none',
                    border: 'none',
                    p: 0,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#dc2626',
                    textDecoration: 'none',
                    '&:hover': {
                      color: '#b91c1c',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Remove rule
                </Typography>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ height: 16, my: 'auto', borderColor: '#cbd5e1' }}
                />
                <IconButton
                  onClick={handleCloseSidebar}
                  size="small"
                  aria-label="Close Sidebar"
                  sx={{
                    color: '#64748b',
                    p: 0.5,
                    borderRadius: '6px',
                    '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            {/* Scrollable Form Body */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <Stack spacing={2.5}>
                {sidebarError && (
                  <Alert severity="error" sx={{ borderRadius: '8px', fontSize: '0.82rem' }}>
                    {sidebarError}
                  </Alert>
                )}

                {/* Minimum Order Value (Threshold) */}
                <Box>
                  <Typography variant="caption" sx={sectionHeaderSx}>
                    Order Condition
                  </Typography>
                  <Box>
                    <Typography variant="caption" sx={fieldLabelSx}>
                      Minimum Order Value *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={draftConfig.threshold || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateDraft('threshold', isNaN(val) ? 0 : val);
                        if (sidebarError) setSidebarError('');
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment
                            position="start"
                            sx={{
                              '& .MuiTypography-root': {
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#64748b',
                              },
                            }}
                          >
                            ₹
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '0.85rem' },
                      }}
                      helperText="Minimum order subtotal required to trigger this promotion rule."
                      FormHelperTextProps={{ sx: { fontSize: '0.72rem', color: '#64748b' } }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ borderColor: '#e2e8f0' }} />

                {/* Financial Limits */}
                <Box>
                  <Typography variant="caption" sx={sectionHeaderSx}>
                    Financial Limits
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={fieldLabelSx}>
                        Profit Percentage Limit
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={draftConfig.profitPercentage}
                        onChange={(e) =>
                          updateDraft('profitPercentage', parseFloat(e.target.value) || 0)
                        }
                        InputProps={{
                          endAdornment: (
                            <InputAdornment
                              position="end"
                              sx={{
                                '& .MuiTypography-root': { fontWeight: 600, fontSize: '0.8rem' },
                              }}
                            >
                              %
                            </InputAdornment>
                          ),
                          sx: { borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '0.85rem' },
                        }}
                        helperText="The cost of the gift cannot exceed this % of the order profit."
                        FormHelperTextProps={{ sx: { fontSize: '0.72rem', color: '#64748b' } }}
                      />
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={6}>
                        <Typography variant="caption" sx={fieldLabelSx}>
                          Min Item Cost Price
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={draftConfig.minCostPrice}
                          onChange={(e) =>
                            updateDraft('minCostPrice', parseFloat(e.target.value) || 0)
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment
                                position="start"
                                sx={{
                                  '& .MuiTypography-root': { fontWeight: 600, fontSize: '0.8rem' },
                                }}
                              >
                                ₹
                              </InputAdornment>
                            ),
                            sx: { borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '0.85rem' },
                          }}
                        />
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption" sx={fieldLabelSx}>
                          Max Item Cost Price
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          placeholder="Auto"
                          value={
                            draftConfig.maxCostPrice === null ? '' : draftConfig.maxCostPrice
                          }
                          onChange={(e) =>
                            updateDraft(
                              'maxCostPrice',
                              e.target.value === '' ? null : parseFloat(e.target.value)
                            )
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment
                                position="start"
                                sx={{
                                  '& .MuiTypography-root': { fontWeight: 600, fontSize: '0.8rem' },
                                }}
                              >
                                ₹
                              </InputAdornment>
                            ),
                            sx: { borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '0.85rem' },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Box>

                <Divider sx={{ borderColor: '#e2e8f0' }} />

                {/* Product Filtering */}
                <Box>
                  <Typography variant="caption" sx={sectionHeaderSx}>
                    Product Filtering
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={fieldLabelSx}>
                        Allowed Categories (Whitelist)
                      </Typography>
                      <Autocomplete
                        multiple
                        size="small"
                        options={categories}
                        value={draftConfig.allowedGroups || []}
                        onChange={(e, newValue) =>
                          updateDraft('allowedGroups', newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="All Groups"
                            sx={{
                              '& .MuiInputBase-root': {
                                borderRadius: '8px',
                                bgcolor: '#f8fafc',
                                fontSize: '0.85rem',
                              },
                            }}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return (
                              <Chip
                                key={key}
                                label={option.split('/').pop()}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  bgcolor: '#f0f9ff',
                                  color: '#0369a1',
                                  fontSize: '0.75rem',
                                }}
                                {...tagProps}
                              />
                            );
                          })
                        }
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={fieldLabelSx}>
                        Excluded Categories (Blacklist)
                      </Typography>
                      <Autocomplete
                        multiple
                        size="small"
                        options={categories}
                        value={draftConfig.disallowedGroups || []}
                        onChange={(e, newValue) =>
                          updateDraft('disallowedGroups', newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="None"
                            sx={{
                              '& .MuiInputBase-root': {
                                borderRadius: '8px',
                                bgcolor: '#f8fafc',
                                fontSize: '0.85rem',
                              },
                            }}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return (
                              <Chip
                                key={key}
                                label={option.split('/').pop()}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  bgcolor: '#fef2f2',
                                  color: '#991b1b',
                                  fontSize: '0.75rem',
                                }}
                                {...tagProps}
                              />
                            );
                          })
                        }
                      />
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ borderColor: '#e2e8f0' }} />

                {/* Display & Sorting */}
                <Box>
                  <Typography variant="caption" sx={sectionHeaderSx}>
                    Display & Sorting
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      <Typography variant="caption" sx={fieldLabelSx}>
                        Max Gifts to Display
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={draftConfig.maxGiftsToShow}
                        onChange={(e) =>
                          updateDraft('maxGiftsToShow', parseInt(e.target.value) || 0)
                        }
                        InputProps={{
                          sx: { borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '0.85rem' },
                        }}
                      />
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" sx={fieldLabelSx}>
                        Sort by Sales
                      </Typography>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={draftConfig.sortBySales || 'none'}
                        onChange={(e) =>
                          updateDraft('sortBySales', e.target.value as 'none' | 'most' | 'least')
                        }
                        SelectProps={{
                          sx: {
                            borderRadius: '8px',
                            bgcolor: '#f8fafc',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                          },
                        }}
                      >
                        <MenuItem value="none" sx={{ fontSize: '0.85rem' }}>
                          Default
                        </MenuItem>
                        <MenuItem value="most" sx={{ fontSize: '0.85rem' }}>
                          Most Sold
                        </MenuItem>
                        <MenuItem value="least" sx={{ fontSize: '0.85rem' }}>
                          Least Sold
                        </MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </Box>

            {/* Footer Actions */}
            <Box
              sx={{
                p: 1.5,
                px: 2,
                bgcolor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={handleCloseSidebar}
                sx={{
                  borderRadius: '8px',
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveChanges}
                sx={{
                  bgcolor: '#0b1d39',
                  borderRadius: '8px',
                  px: 2.5,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
              >
                Save Changes
              </Button>
            </Box>
          </InventoryPanelShell>
        </Box>
      )}

      {/* Small Form Dialog to Add New Rule */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <Box component="form" onSubmit={handleDialogSubmit}>
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 1,
              pt: 1.5,
              px: 2,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
              Add New Threshold Rule
            </Typography>
            <IconButton size="small" onClick={handleCloseAddDialog} sx={{ color: '#64748b' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 2, pt: '10px !important', pb: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem', mb: 2 }}>
              Define a minimum purchase amount and gift criteria for this promotion rule.
            </Typography>

            {addFormError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.82rem' }}>
                {addFormError}
              </Alert>
            )}

            <Stack spacing={2}>
              <Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', mb: 0.75 }}>
                  Min Order Subtotal *
                </Typography>
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="e.g. 500"
                  value={addFormThreshold}
                  onChange={(e) => {
                    setAddFormThreshold(e.target.value);
                    if (addFormError) setAddFormError('');
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment
                        position="start"
                        sx={{
                          '& .MuiTypography-root': {
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: '#64748b',
                          },
                        }}
                      >
                        ₹
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', mb: 0.75 }}>
                  Min Profit Margin (%)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="20"
                  value={addFormProfit}
                  onChange={(e) => setAddFormProfit(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment
                        position="end"
                        sx={{
                          '& .MuiTypography-root': {
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: '#64748b',
                          },
                        }}
                      >
                        %
                      </InputAdornment>
                    ),
                  }}
                  helperText="Items with profit margin ≥ this % will be eligible gifts"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: '0.72rem',
                      color: '#64748b',
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', mb: 0.75 }}>
                  Max Gifts to Display
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="5"
                  value={addFormMaxGifts}
                  onChange={(e) => setAddFormMaxGifts(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCloseAddDialog}
              sx={{
                borderRadius: '8px',
                borderColor: '#cbd5e1',
                color: '#475569',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              type="submit"
              sx={{
                borderRadius: '8px',
                bgcolor: '#0b1d39',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                px: 2.5,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1e293b' },
              }}
            >
              Create Rule
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Confirmation Dialog for Removing Rule */}
      <Dialog
        open={ruleToDelete !== null}
        onClose={() => setRuleToDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            pt: 1.5,
            px: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
            Remove Threshold Rule
          </Typography>
          <IconButton size="small" onClick={() => setRuleToDelete(null)} sx={{ color: '#64748b' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 2, pt: '10px !important', pb: 2 }}>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
            Are you sure you want to remove this rule?
          </Typography>
          {ruleToDelete !== null && (
            <Typography
              variant="caption"
              sx={{ color: '#64748b', fontSize: '0.75rem', mt: 0.75, display: 'block' }}
            >
              Minimum order value: ₹{ruleToDelete.toLocaleString()}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setRuleToDelete(null)}
            sx={{
              borderRadius: '8px',
              borderColor: '#cbd5e1',
              color: '#475569',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              px: 2,
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            No
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleConfirmRemove}
            sx={{
              borderRadius: '8px',
              bgcolor: '#dc2626',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              px: 2.5,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThresholdSettingsPanel;
