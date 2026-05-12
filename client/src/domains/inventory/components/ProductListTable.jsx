import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
} from '@mui/material';
import ProductRow from '@/domains/inventory/components/ProductRow';

const ProductListTable = ({
  displayedProducts, selectedIds, sortBy, sortOrder, isPending,
  onSort, onSelect, onDragStart, onEdit, onDelete, onDoubleClick,
}) => {
  const tableContainerRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: displayedProducts.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
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
      sx={{
        flex: 1,
        overflow: 'auto',
        overflowX: 'scroll',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0' }}>
            <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, width: '50px', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              S.No.
            </TableCell>
            <TableCell sx={{ px: 1.5, minWidth: '220px', maxWidth: '220px' }}>
              <TableSortLabel
                active={sortBy === 'name'}
                direction={sortBy === 'name' ? sortOrder : 'asc'}
                onClick={() => onSort('name')}
                sx={{ 
                  fontWeight: 700, 
                  color: '#475569', 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase',
                  '& .MuiTableSortLabel-icon': { opacity: 1 }
                }}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ px: 1.5, minWidth: '200px', maxWidth: '200px' }}>
              <TableSortLabel
                active={sortBy === 'barcode'}
                direction={sortBy === 'barcode' ? sortOrder : 'asc'}
                onClick={() => onSort('barcode')}
                sx={{ 
                  fontWeight: 700, 
                  color: '#475569', 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase',
                  '& .MuiTableSortLabel-icon': { opacity: 1 }
                }}
              >
                Barcode
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
              <TableSortLabel
                active={sortBy === 'batchTrackingEnabled'}
                direction={sortBy === 'batchTrackingEnabled' ? sortOrder : 'asc'}
                onClick={() => onSort('batchTrackingEnabled')}
                sx={{ 
                  fontWeight: 700, 
                  color: '#475569', 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase',
                  '& .MuiTableSortLabel-icon': { opacity: 1 }
                }}
              >
                Batch Tracking
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
              <TableSortLabel
                active={sortBy === 'lowStockWarningEnabled'}
                direction={sortBy === 'lowStockWarningEnabled' ? sortOrder : 'asc'}
                onClick={() => onSort('lowStockWarningEnabled')}
                sx={{ 
                  fontWeight: 700, 
                  color: '#475569', 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase',
                  '& .MuiTableSortLabel-icon': { opacity: 1 }
                }}
              >
                Low Stock
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
              <TableSortLabel
                active={sortBy === 'stock'}
                direction={sortBy === 'stock' ? sortOrder : 'asc'}
                onClick={() => onSort('stock')}
                sx={{ 
                  fontWeight: 700, 
                  color: '#475569', 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase',
                  '& .MuiTableSortLabel-icon': { opacity: 1 }
                }}
              >
                Stock
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
              <TableSortLabel
                active={sortBy === 'lastUpdatedAt'}
                direction={sortBy === 'lastUpdatedAt' ? sortOrder : 'desc'}
                onClick={() => onSort('lastUpdatedAt')}
                sx={{
                  fontWeight: 700,
                  color: '#475569',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  '& .MuiTableSortLabel-icon': { opacity: 1 }
                }}
              >
                Last Updated
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paddingTop > 0 && (
            <TableRow>
              <TableCell colSpan={8} sx={{ height: paddingTop, p: 0, border: 0 }} />
            </TableRow>
          )}
          {virtualItems.map((virtualRow) => {
            const product = displayedProducts[virtualRow.index];
            return (
              <ProductRow
                key={product.id}
                product={product}
                index={virtualRow.index}
                isSelected={selectedIds.has(String(product.id))}
                onSelect={onSelect}
                onDragStart={onDragStart}
                onEdit={onEdit}
                onDelete={onDelete}
                onDoubleClick={onDoubleClick}
              />
            );
          })}
          {paddingBottom > 0 && (
            <TableRow>
              <TableCell colSpan={8} sx={{ height: paddingBottom, p: 0, border: 0 }} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductListTable;
