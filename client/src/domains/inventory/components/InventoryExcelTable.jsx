import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
} from '@mui/material';
import { INVENTORY_COLUMNS } from '@/domains/inventory/components/inventoryTableConfig';

const InventoryExcelTable = ({
  cols,
  sortConfigs,
  handleSort,
  filteredAndSortedData,
  getExpiryColor,
  totals,
}) => {
  const visibleColumns = INVENTORY_COLUMNS.filter((col) => cols[col.id]);

  return (
    <TableContainer
      component={Paper}
      sx={{ maxHeight: 'calc(100vh - 250px)', borderRadius: 2, border: '1px solid #ccc' }}
    >
      <Table
        stickyHeader
        size="small"
        sx={{
          minWidth: 1200,
          '& .MuiTableCell-root': {
            border: '1px solid #e0e0e0',
            whiteSpace: 'nowrap',
            padding: '4px 8px',
          },
          '& .MuiTableRow-root:nth-of-type(odd)': {
            bgcolor: 'rgba(0, 0, 0, 0.02)',
          },
        }}
      >
        <TableHead>
          <TableRow>
            {visibleColumns.map((col) => (
              <TableCell
                key={col.id}
                align={col.align || 'left'}
                sx={{
                  bgcolor: '#e8eaf6',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  ...(col.sticky && {
                    position: 'sticky',
                    left: col.left || 0,
                    zIndex: 3,
                    borderRight: '2px solid #ccc',
                  }),
                }}
              >
                {col.sortable ? (
                  <TableSortLabel
                    active={sortConfigs.some((c) => c.key === col.id)}
                    direction={sortConfigs.find((c) => c.key === col.id)?.direction || 'asc'}
                    onClick={(e) => handleSort(col.id, e)}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredAndSortedData.map((row, index) => (
            <TableRow
              hover
              key={row.id}
              sx={{
                '&:hover .MuiTableCell-root:not(.sticky-col)': {
                  bgcolor: 'rgba(25, 118, 210, 0.15) !important',
                },
              }}
            >
              {visibleColumns.map((col) => {
                const cellValue = col.id === 'sno' ? index + 1 : row[col.id];
                const content = col.render ? col.render(row, { getExpiryColor }) : cellValue;

                return (
                  <TableCell
                    key={col.id}
                    align={col.align || 'left'}
                    className={col.sticky ? 'sticky-col' : ''}
                    sx={{
                      py: 0.5,
                      ...(col.bold && { fontWeight: 700 }),
                      ...(col.color && { color: col.color }),
                      ...(col.font && { fontFamily: col.font }),
                      ...(col.sticky && {
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        left: col.left || 0,
                        zIndex: 2,
                        borderRight: '2px solid #ccc',
                        transition: 'background-color 0.2s',
                        '.MuiTableRow-hover:hover &': { bgcolor: '#f5f5f5' },
                      }),
                      // Special case for stock column background
                      ...(col.id === 'stock' && {
                        bgcolor: row.stock <= 5 ? '#ffebee' : row.stock <= 15 ? '#fff3e0' : '#e8f5e9',
                      }),
                    }}
                  >
                    {content}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>

        <TableBody>
          <TableRow
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 4,
              '& .MuiTableCell-root': {
                bgcolor: '#e1e3f1',
                borderTop: '2px solid #ccc',
              },
            }}
          >
            {visibleColumns.map((col, idx) => {
              const isFirst = idx === 0;
              return (
                <TableCell
                  key={`total-${col.id}`}
                  align={col.align || 'left'}
                  sx={{
                    fontWeight: 800,
                    py: 1.5,
                    ...(col.sticky && {
                      position: 'sticky',
                      left: col.left || 0,
                      zIndex: 5,
                      borderRight: '2px solid #ccc',
                    }),
                    ...(col.totalSx || {}),
                  }}
                >
                  {isFirst ? 'TOTALS / AVERAGES' : col.total ? col.total(totals) : ''}
                </TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InventoryExcelTable;
