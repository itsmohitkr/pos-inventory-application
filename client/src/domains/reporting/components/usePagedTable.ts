import React from 'react';

interface PagedTable<T> {
  page: number;
  rowsPerPage: number;
  paginatedItems: T[];
  setPage: (page: number) => void;
  handleRowsPerPageChange: (newRows: number) => void;
}

export function usePagedTable<T>(items: T[], resetDeps: React.DependencyList): PagedTable<T> {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  React.useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const paginatedItems = React.useMemo(
    () => items.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [items, page, rowsPerPage]
  );

  const handleRowsPerPageChange = (newRows: number) => {
    setRowsPerPage(newRows);
    setPage(0);
  };

  return { page, rowsPerPage, paginatedItems, setPage, handleRowsPerPageChange };
}

export default usePagedTable;
