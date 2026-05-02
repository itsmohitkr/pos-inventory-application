import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
} from '@mui/material';

const AnalyticsCashFlowTable = ({ totalSales, cashFlowItems, totalCashBalance }) => (
  <Box>
    <Typography
      variant="overline"
      sx={{ color: '#64748b', fontWeight: 800, letterSpacing: 1.5, mb: 2, display: 'block' }}
    >
      CASH FLOW STATEMENT (CHRONOLOGICAL)
    </Typography>
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <Table stickyHeader>
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc', top: 0, zIndex: 2, py: 1 }}>
              PARTICULARS
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc', top: 0, zIndex: 2, py: 1 }}>
              AMOUNT (₹)
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: '#1e293b', bgcolor: 'white', borderBottom: '2px solid #e2e8f0', top: 40, zIndex: 2 }}>
              Total Sales (Gross Income)
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color: '#16a34a', bgcolor: 'white', borderBottom: '2px solid #e2e8f0', top: 40, zIndex: 2 }}>
              + {totalSales.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cashFlowItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell sx={{ color: '#64748b', pl: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    Less: {item.type === 'Expense' ? 'Expense' : 'Inventory Purchase'} ({item.label})
                  </span>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', ml: 2 }}>
                    {item.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: '#dc2626' }}>
                - {item.amount.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 1, bgcolor: '#f0fdf4' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#166534', borderTop: '2px solid #16a34a' }}>
              TOTAL MONEY IN SHOP (NET BALANCE)
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#166534', borderTop: '2px solid #16a34a' }}>
              ₹ {totalCashBalance.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  </Box>
);

export default AnalyticsCashFlowTable;
