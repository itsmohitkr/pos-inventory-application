import React from 'react';
import { TableRow, TableCell, Box, Typography } from '@mui/material';

interface ReportTableEmptyStateProps {
  colSpan: number;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const ReportTableEmptyState = ({
  colSpan,
  icon,
  title,
  subtitle,
}: ReportTableEmptyStateProps) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ color: '#94a3b8', display: 'flex', mb: 1, '& > svg': { fontSize: 38 } }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </TableCell>
  </TableRow>
);

export default ReportTableEmptyState;
