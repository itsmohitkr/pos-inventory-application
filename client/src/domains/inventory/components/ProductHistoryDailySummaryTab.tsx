import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from '@mui/material';
import type { StockMovementDaySummary } from '@/domains/inventory/components/inventoryTypes';

interface ProductHistoryDailySummaryTabProps {
  summaryByDate: StockMovementDaySummary[];
  formatDate: (value?: string | null) => string;
}

/** Not paginated: one row per calendar day with any movement, so row count
 * is capped by days in the range rather than event volume. */
const ProductHistoryDailySummaryTab = ({ summaryByDate, formatDate }: ProductHistoryDailySummaryTabProps) => (
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Date</TableCell>
        <TableCell align="right">Added</TableCell>
        <TableCell align="right">Sold</TableCell>
        <TableCell align="right">Returned</TableCell>
        <TableCell align="right">Adjust +</TableCell>
        <TableCell align="right">Adjust -</TableCell>
        <TableCell align="right">Net</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {summaryByDate.length === 0 ? (
        <TableRow>
          <TableCell colSpan={7} align="center">
            <Typography variant="body2" color="text.secondary">
              No history for this range
            </Typography>
          </TableCell>
        </TableRow>
      ) : (
        summaryByDate.map((row) => (
          <TableRow key={row.date}>
            <TableCell>{formatDate(row.date)}</TableCell>
            <TableCell align="right">{row.added}</TableCell>
            <TableCell align="right">{row.sold}</TableCell>
            <TableCell align="right">{row.returned}</TableCell>
            <TableCell align="right">{row.adjustmentIn}</TableCell>
            <TableCell align="right">{row.adjustmentOut}</TableCell>
            <TableCell align="right">{row.net}</TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

export default ProductHistoryDailySummaryTab;
