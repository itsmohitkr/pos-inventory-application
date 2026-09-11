import type {
  InventoryRow,
  InventorySortConfig,
} from '@/domains/inventory/components/inventoryExcelUtils';
import type { InventoryTotals } from '@/domains/inventory/components/inventoryTableConfig';

interface InventoryExcelTableProps {
  /** Column visibility, keyed by InventoryColumn id. */
  cols: Record<string, boolean>;
  /** Applied in array order, outermost first. */
  sortConfigs: InventorySortConfig[];
  /** Shift-click adds a secondary sort level, hence the event. */
  handleSort: (key: string, event?: React.MouseEvent) => void;
  filteredAndSortedData: InventoryRow[];
  getExpiryColor: (expiry?: string | null) => string;
  totals: InventoryTotals;
}

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
}: InventoryExcelTableProps) => {
  const visibleColumns = INVENTORY_COLUMNS.filter((col) => cols[col.id]);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Rows are per-batch, not per-product, so a shop with batch tracking on
  // can easily have far more rows than products — virtualize so only the
  // rows actually on screen get rendered, same pattern as ProductListTable.
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 33,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  return (
    <TableContainer
      ref={tableContainerRef}
      component={Paper}
      elevation={0}
      sx={{
        flex: 1,
        height: '100%',
        maxHeight: '100%',
        overflow: 'auto',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 transparent',
        '&::-webkit-scrollbar': {
          height: '6px',
          width: '6px',
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
      <Table
        stickyHeader
        size="small"
        sx={{
          minWidth: 1200,
          '& .MuiTableCell-root': {
            border: '1px solid #e2e8f0',
            whiteSpace: 'nowrap',
            padding: '5px 10px',
            fontSize: '0.8rem',
          },
          '& .MuiTableRow-root:nth-of-type(odd)': {
            bgcolor: 'rgba(248, 250, 252, 0.6)',
          },
        }}
      >
        <TableHead>
          <TableRow>
            {visibleColumns.map((col) => (
              <TableCell
                key={col.id}
                align={(col.align || 'left') as 'left' | 'right' | 'center'}
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap',
                  borderBottom: '2px solid #cbd5e1',
                  ...(col.sticky && {
                    position: 'sticky',
                    left: col.left || 0,
                    zIndex: 3,
                    borderRight: '2px solid #cbd5e1',
                  }),
                }}
              >
                {col.sortable ? (
                  <TableSortLabel
                    active={sortConfigs.some((c) => c.key === col.id)}
                    direction={sortConfigs.find((c) => c.key === col.id)?.direction || 'asc'}
                    onClick={(e) => handleSort(col.id, e)}
                    sx={{
                      fontWeight: 700,
                      color: '#334155',
                      '&.Mui-active': { color: '#0b1d39' },
                    }}
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
          {paddingTop > 0 && (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} sx={{ height: paddingTop, p: 0, border: 0 }} />
            </TableRow>
          )}
          {virtualItems.map((virtualRow) => {
            const row = filteredAndSortedData[virtualRow.index];
            const index = virtualRow.index;
            return (
              <TableRow
                hover
                key={row.id}
                sx={{
                  '&:hover .MuiTableCell-root:not(.sticky-col)': {
                    bgcolor: 'rgba(11, 29, 57, 0.04) !important',
                  },
                }}
              >
                {visibleColumns.map((col) => {
                  // 'sno' is a rendered row number, every other column id is a
                  // field on InventoryRow.
                  const cellValue =
                    col.id === 'sno' ? index + 1 : row[col.id as keyof InventoryRow];
                  const content = col.render ? col.render(row, { getExpiryColor }) : cellValue;

                  return (
                    <TableCell
                      key={col.id}
                      align={(col.align || 'left') as 'left' | 'right' | 'center'}
                      className={col.sticky ? 'sticky-col' : ''}
                      sx={{
                        py: 0.6,
                        ...(col.bold && { fontWeight: 600 }),
                        ...(col.color && { color: col.color }),
                        ...(col.font && { fontFamily: col.font }),
                        ...(col.sticky && {
                          bgcolor: 'background.paper',
                          position: 'sticky',
                          left: col.left || 0,
                          zIndex: 2,
                          borderRight: '2px solid #cbd5e1',
                          transition: 'background-color 0.2s',
                          '.MuiTableRow-hover:hover &': { bgcolor: '#f8fafc' },
                        }),
                        // Special case for stock column background
                        ...(col.id === 'stock' && {
                          bgcolor: row.stock <= 5 ? '#fef2f2' : row.stock <= 15 ? '#fffbeb' : '#f0fdf4',
                        }),
                      }}
                    >
                      {content}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} sx={{ height: paddingBottom, p: 0, border: 0 }} />
            </TableRow>
          )}
        </TableBody>

        <TableBody>
          <TableRow
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 4,
              '& .MuiTableCell-root': {
                bgcolor: '#f1f5f9',
                borderTop: '2px solid #cbd5e1',
                color: '#0b1d39',
              },
            }}
          >
            {visibleColumns.map((col, idx) => {
              const isFirst = idx === 0;
              return (
                <TableCell
                  key={`total-${col.id}`}
                  align={(col.align || 'left') as 'left' | 'right' | 'center'}
                  sx={{
                    fontWeight: 800,
                    py: 1.25,
                    fontSize: '0.8rem',
                    ...(col.sticky && {
                      position: 'sticky',
                      left: col.left || 0,
                      zIndex: 5,
                      borderRight: '2px solid #cbd5e1',
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
