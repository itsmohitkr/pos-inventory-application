import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface InventoryPanelShellProps {
  /** Omit to render the shell with no header (e.g. a loading/empty state). */
  title?: string;
  /** Rendered on the right side of the header, next to the title. */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared right-panel shell (border/radius/header chrome) for the inventory
 * page's right-hand panel — used by both `ProductDetailPanel` (viewing a
 * product) and the inline add-product panel in `ProductList.tsx`, so a
 * visual tweak to one doesn't silently drift from the other.
 */
const InventoryPanelShell = ({ title, headerRight, children }: InventoryPanelShellProps) => (
  <Paper
    elevation={0}
    data-testid="inventory-detail-panel"
    sx={{
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      bgcolor: '#ffffff',
      minWidth: 0,
      width: '100%',
    }}
  >
    {title && (
      <Box
        sx={{
          p: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          borderBottom: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.85rem' }}>
          {title}
        </Typography>
        {headerRight && (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>{headerRight}</Box>
        )}
      </Box>
    )}
    {children}
  </Paper>
);

export default InventoryPanelShell;
