import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { formatShortNum } from '../../utils/dateUtils';

export const TopProductsTable = ({ products }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: '1 1 30%',
        p: 2,
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" sx={{ color: '#0b1d39', fontWeight: 600 }}>
          Top Products
        </Typography>
      </Box>

      <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: '#0b1d39',
                  borderBottom: '2px solid #0b1d39',
                  py: 0.5,
                  px: 0,
                  bgcolor: 'white',
                }}
              >
                Product
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: '#64748b',
                  borderBottom: '1px solid #e2e8f0',
                  py: 0.5,
                  px: 0,
                  bgcolor: 'white',
                }}
              >
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(([name, total]) => (
              <TableRow key={name}>
                <TableCell
                  sx={{ py: 1, px: 0, color: '#4b5563', borderBottom: '1px solid #f3f4f6' }}
                >
                  {name}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ py: 1, px: 0, color: '#4b5563', borderBottom: '1px solid #f3f4f6' }}
                >
                  {total.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export const CategoryMixChart = ({ mix }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: '1 1 30%',
        p: 2,
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <Typography variant="h5" sx={{ color: '#0b1d39', fontWeight: 600, mb: 0 }}>
        Top Product Groups
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b', mb: 2 }}>
        Top selling product groups in selected period
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: mix.gradient,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '25%',
                left: '25%',
                width: '50%',
                height: '50%',
                bgcolor: '#fff',
                borderRadius: '50%',
              }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            overflowY: 'auto',
            maxHeight: '120px',
          }}
        >
          {mix.segments.map((seg) => (
            <Box
              key={seg.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 16, bgcolor: seg.color }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#4b5563',
                    fontSize: '0.65rem',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {seg.name} ({seg.percent.toFixed(0)}%)
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: '#111827', fontSize: '0.65rem', fontWeight: 600 }}
              >
                {formatShortNum(seg.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};
