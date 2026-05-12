import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { PieChart as PieChartIcon } from '@mui/icons-material';

const DonutChart = ({ segments, gradient, emptyLabel }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 150 }}>
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: segments.length ? `conic-gradient(${gradient})` : '#e2e8f0',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%', bgcolor: '#fff', borderRadius: '50%' }} />
      </Box>
    </Box>
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', maxHeight: '150px' }}>
      {segments.length === 0 && (
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>{emptyLabel}</Typography>
      )}
      {segments.map((seg) => (
        <Box key={seg.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: seg.color }} />
            <Typography variant="caption" sx={{ color: '#4b5563', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {seg.name} ({seg.percent.toFixed(0)}%)
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 600 }}>
            ₹{seg.value.toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

const AnalyticsCategoryBreakdown = ({ expenseSegments, expenseGradient, purchaseSegments, purchaseGradient }) => (
  <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
    <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <PieChartIcon sx={{ color: '#0b1d39' }} />
        <Typography variant="h6" sx={{ color: '#0b1d39', fontWeight: 700 }}>Expenses by Category</Typography>
      </Box>
      <Typography variant="caption" sx={{ color: '#64748b', mb: 3 }}>Breakdown of operating costs</Typography>
      <DonutChart segments={expenseSegments} gradient={expenseGradient} emptyLabel="No expenses to display" />
    </Paper>

    <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <PieChartIcon sx={{ color: '#0b1d39' }} />
        <Typography variant="h6" sx={{ color: '#0b1d39', fontWeight: 700 }}>Purchases by Vendor</Typography>
      </Box>
      <Typography variant="caption" sx={{ color: '#64748b', mb: 3 }}>Breakdown of inventory investments</Typography>
      <DonutChart segments={purchaseSegments} gradient={purchaseGradient} emptyLabel="No purchases to display" />
    </Paper>
  </Box>
);

export default AnalyticsCategoryBreakdown;
