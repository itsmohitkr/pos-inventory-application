import React, { useState } from 'react';
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
  Drawer,
  Stack,
  Tooltip,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

const ThresholdSettingsPanel = ({
  promoSettings,
  setPromoSettings,
  newThreshold,
  setNewThreshold,
  categories,
  onSave,
  onAddThreshold,
  onUpdateConfig,
  onRemoveThreshold,
}) => {
  const [editingThreshold, setEditingThreshold] = useState(null);

  const editingConfig = (promoSettings.config || []).find(
    (c) => c.threshold === editingThreshold
  );

  const handleEditClick = (config) => {
    setEditingThreshold(config.threshold);
  };

  const handleCloseDrawer = () => {
    setEditingThreshold(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SettingsIcon sx={{ color: '#0f172a' }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0b1d39', letterSpacing: '-0.5px' }}>
              Order Threshold Promotions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              borderRadius: '10px',
              px: 4,
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Save Configuration
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '10px', border: '1px solid #f1f5f9', mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={promoSettings.enabled}
                    onChange={(e) => setPromoSettings({ ...promoSettings, enabled: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10b981' },
                    }}
                  />
                }
                label={<Typography sx={{ fontWeight: 700, color: '#1e293b' }}>Enable Automated Gifts</Typography>}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500, maxWidth: 600 }}>
                When enabled, customers will receive a free product from eligible categories when their order subtotal reaches one of the thresholds defined below.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569', letterSpacing: '0.5px' }}>
                THRESHOLD RULES
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  placeholder="Order Total (₹)"
                  size="small"
                  type="number"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onAddThreshold()}
                  sx={{
                    width: 200,
                    '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f8fafc' }
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontWeight: 800 } }}>₹</InputAdornment>
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={onAddThreshold}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    color: '#0f172a',
                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                  }}
                >
                  Add Rule
                </Button>
              </Box>
            </Box>

            <TableContainer
              elevation={0}
              sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Status</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Min Order Total</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Profit % Limit</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Max Gifts</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Group Filtering</TableCell>
                    <TableCell align="right" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(promoSettings.config || []).map((config) => (
                    <TableRow
                      key={config.threshold}
                      hover
                      onClick={() => handleEditClick(config)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch
                          size="small"
                          checked={config.isActive !== false}
                          onChange={(e) =>
                            onUpdateConfig(config.threshold, 'isActive', e.target.checked)
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10b981' },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                        ₹{config.threshold.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            {config.profitPercentage}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#64748b' }}>
                          {config.maxGiftsToShow} Products
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {config.allowedGroups?.length > 0 ? (
                            <Chip
                              label={`${config.allowedGroups.length} Groups`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f0f9ff', color: '#0369a1' }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8' }}>ALL PRODUCTS</Typography>
                          )}
                          {config.disallowedGroups?.length > 0 && (
                            <Chip
                              label={`-${config.disallowedGroups.length}`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#fef2f2', color: '#991b1b' }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit Configuration">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(config)}
                              sx={{ color: '#0f172a', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '8px' }}
                            >
                              <ChevronRightIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Rule">
                            <IconButton
                              size="small"
                              onClick={() => onRemoveThreshold(config.threshold)}
                              sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, borderRadius: '8px' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(promoSettings.config || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 700 }}>NO THRESHOLDS DEFINED</Typography>
                        <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Add a minimum order value above to start configuring gifts</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Paper>

      {/* Configuration Drawer */}
      <Drawer
        anchor="right"
        open={editingThreshold !== null}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: 420, bgcolor: '#f8fafc', borderLeft: '1px solid #e2e8f0' }
        }}
      >
        {editingConfig && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Rule: ₹{editingConfig.threshold.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  DETAILED CONFIGURATION
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDrawer} size="small" sx={{ bgcolor: '#f1f5f9' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Stack spacing={4}>
                {/* Profit Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', mb: 1.5, letterSpacing: '0.5px' }}>
                    FINANCIAL LIMITS
                  </Typography>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5 }}>PROFIT PERCENTAGE LIMIT</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={editingConfig.profitPercentage}
                        onChange={(e) =>
                          onUpdateConfig(
                            editingConfig.threshold,
                            'profitPercentage',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        InputProps={{
                          endAdornment: <InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontWeight: 800 } }}>%</InputAdornment>,
                          sx: { borderRadius: '10px', bgcolor: '#ffffff', fontWeight: 800 },
                        }}
                        helperText="The cost of the gift cannot exceed this % of the order profit."
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5 }}>MIN ITEM CP</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={editingConfig.minCostPrice}
                          onChange={(e) =>
                            onUpdateConfig(
                              editingConfig.threshold,
                              'minCostPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          InputProps={{
                            startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontWeight: 800 } }}>₹</InputAdornment>,
                            sx: { borderRadius: '10px', bgcolor: '#ffffff', fontWeight: 800 },
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5 }}>MAX ITEM CP</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          placeholder="Auto (Profit)"
                          value={editingConfig.maxCostPrice === null ? '' : editingConfig.maxCostPrice}
                          onChange={(e) =>
                            onUpdateConfig(
                              editingConfig.threshold,
                              'maxCostPrice',
                              e.target.value === '' ? null : parseFloat(e.target.value)
                            )
                          }
                          InputProps={{
                            startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontWeight: 800 } }}>₹</InputAdornment>,
                            sx: { borderRadius: '10px', bgcolor: '#ffffff', fontWeight: 800 },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* Groups Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', mb: 1.5, letterSpacing: '0.5px' }}>
                    PRODUCT FILTERING
                  </Typography>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5 }}>ALLOWED GROUPS (WHITE-LIST)</Typography>
                      <Autocomplete
                        multiple
                        size="small"
                        options={categories}
                        value={editingConfig.allowedGroups || []}
                        onChange={(e, newValue) =>
                          onUpdateConfig(editingConfig.threshold, 'allowedGroups', newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="All Groups"
                            sx={{
                              '& .MuiInputBase-root': { borderRadius: '10px', bgcolor: '#ffffff', fontWeight: 700 },
                            }}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={option.split('/').pop()}
                              size="small"
                              sx={{ fontWeight: 800, borderRadius: '6px', bgcolor: '#f1f5f9' }}
                              {...getTagProps({ index })}
                            />
                          ))
                        }
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5 }}>EXCLUDED GROUPS (BLACK-LIST)</Typography>
                      <Autocomplete
                        multiple
                        size="small"
                        options={categories}
                        value={editingConfig.disallowedGroups || []}
                        onChange={(e, newValue) =>
                          onUpdateConfig(editingConfig.threshold, 'disallowedGroups', newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="None"
                            sx={{
                              '& .MuiInputBase-root': { borderRadius: '10px', bgcolor: '#ffffff', fontWeight: 700 },
                            }}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={option.split('/').pop()}
                              size="small"
                              sx={{ fontWeight: 800, borderRadius: '6px', bgcolor: '#fef2f2', color: '#991b1b' }}
                              {...getTagProps({ index })}
                            />
                          ))
                        }
                      />
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* Display Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', mb: 1.5, letterSpacing: '0.5px' }}>
                    DISPLAY & SORTING
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5 }}>MAX GIFTS TO SHOW</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={editingConfig.maxGiftsToShow}
                        onChange={(e) =>
                          onUpdateConfig(
                            editingConfig.threshold,
                            'maxGiftsToShow',
                            parseInt(e.target.value) || 0
                          )
                        }
                        InputProps={{ sx: { borderRadius: '10px', bgcolor: '#ffffff', fontWeight: 800 } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5 }}>SORT GIFTS BY SALES</Typography>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={editingConfig.sortBySales || 'none'}
                        onChange={(e) =>
                          onUpdateConfig(editingConfig.threshold, 'sortBySales', e.target.value)
                        }
                        SelectProps={{
                          sx: { borderRadius: '10px', bgcolor: '#ffffff', fontWeight: 800 },
                        }}
                      >
                        <MenuItem value="none" sx={{ fontWeight: 600 }}>Default</MenuItem>
                        <MenuItem value="most" sx={{ fontWeight: 600 }}>Most Sold</MenuItem>
                        <MenuItem value="least" sx={{ fontWeight: 600 }}>Least Sold</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCloseDrawer}
                sx={{
                  bgcolor: '#0f172a',
                  borderRadius: '10px',
                  py: 1.25,
                  fontWeight: 900,
                  '&:hover': { bgcolor: '#1e293b' }
                }}
              >
                DONE
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default ThresholdSettingsPanel;
