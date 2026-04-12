import React from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
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
}) => (
  <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
      <SettingsIcon color="primary" />
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0b1d39' }}>
        Order Threshold Promotions (Buy X Get 1 Free)
      </Typography>
    </Box>
    <Grid container spacing={3}>
      <Grid item xs={12} md={9}>
        <FormControlLabel
          control={
            <Switch
              checked={promoSettings.enabled}
              onChange={(e) => setPromoSettings({ ...promoSettings, enabled: e.target.checked })}
              color="primary"
            />
          }
          label={<Typography sx={{ fontWeight: 600 }}>Enable Threshold Promotions</Typography>}
        />
        <Typography variant="body2" color="text.secondary">
          Customers receive a free product when their order total meets the thresholds defined in the table below.
        </Typography>
      </Grid>
      <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSave}
          sx={{
            bgcolor: '#22ab7dff',
            '&:hover': { bgcolor: '#059669' },
            borderRadius: 2,
            px: 4,
          }}
        >
          Save Settings
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Threshold Configuration Table
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              placeholder="Min Order Value (₹)"
              size="small"
              type="number"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onAddThreshold()}
              sx={{ width: 180 }}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <Button variant="outlined" startIcon={<AddIcon />} onClick={onAddThreshold} sx={{ borderRadius: 2 }}>
              Add Row
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '8%' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '12%' }}>Min Order (₹)</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '12%' }}>Profit % Limit</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '12%' }}>Min Item CP</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '11%' }}>Max Item CP</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '15%' }}>Allowed Groups</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '15%' }}>Disallowed Groups</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '9%' }}>Max Gifts</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '12%' }}>Sort By</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: '10%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(promoSettings.config || []).map((config) => (
                <TableRow key={config.threshold} hover>
                  <TableCell>
                    <Switch
                      size="small"
                      checked={config.isActive !== false}
                      onChange={(e) => onUpdateConfig(config.threshold, 'isActive', e.target.checked)}
                      color="success"
                      sx={{
                        '& .MuiSwitch-switchBase:not(.Mui-checked)': { color: '#ef4444' },
                        '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                          backgroundColor: '#ef4444',
                          opacity: 0.5,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0b1d39' }}>₹{config.threshold}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={config.profitPercentage}
                      onChange={(e) => onUpdateConfig(config.threshold, 'profitPercentage', parseFloat(e.target.value) || 0)}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment>, sx: { borderRadius: 1.5, fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={config.minCostPrice}
                      onChange={(e) => onUpdateConfig(config.threshold, 'minCostPrice', parseFloat(e.target.value) || 0)}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, sx: { borderRadius: 1.5, fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Auto (% Profit)"
                      value={config.maxCostPrice === null ? '' : config.maxCostPrice}
                      onChange={(e) => onUpdateConfig(config.threshold, 'maxCostPrice', e.target.value === '' ? null : parseFloat(e.target.value))}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, sx: { borderRadius: 1.5, fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      multiple
                      size="small"
                      options={categories}
                      value={config.allowedGroups || []}
                      onChange={(e, newValue) => onUpdateConfig(config.threshold, 'allowedGroups', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="All Groups"
                          sx={{ '& .MuiInputBase-root': { borderRadius: 1.5, fontSize: '0.75rem' } }}
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={option.split('/').pop()} size="small" {...getTagProps({ index })} />
                        ))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      multiple
                      size="small"
                      options={categories}
                      value={config.disallowedGroups || []}
                      onChange={(e, newValue) => onUpdateConfig(config.threshold, 'disallowedGroups', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="None"
                          sx={{ '& .MuiInputBase-root': { borderRadius: 1.5, fontSize: '0.75rem' } }}
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={option.split('/').pop()} size="small" {...getTagProps({ index })} />
                        ))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={config.maxGiftsToShow}
                      onChange={(e) => onUpdateConfig(config.threshold, 'maxGiftsToShow', parseInt(e.target.value) || 0)}
                      InputProps={{ sx: { borderRadius: 1.5, fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={config.sortBySales || 'none'}
                      onChange={(e) => onUpdateConfig(config.threshold, 'sortBySales', e.target.value)}
                      SelectProps={{ native: true, sx: { borderRadius: 1.5, fontSize: '0.875rem' } }}
                    >
                      <option value="none">Default</option>
                      <option value="most">Most</option>
                      <option value="least">Least</option>
                    </TextField>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveThreshold(config.threshold)}
                      sx={{ bgcolor: '#fff1f2', '&:hover': { bgcolor: '#ffe4e6' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {(promoSettings.config || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No thresholds defined. Add a minimum order value above to start.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  </Paper>
);

export default ThresholdSettingsPanel;
