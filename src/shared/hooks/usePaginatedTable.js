




import { useState, useMemo } from "react";

const DEFAULT_PAGE_SIZE = 20;


export function usePaginatedTable(rows, pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil((rows?.length ?? 0) / pageSize));


  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    if (!rows?.length) return [];
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);


  const goTo = (n) => setPage(Math.max(1, Math.min(n, totalPages)));

  return {
    paged,
    page: safePage,
    setPage: goTo,
    totalPages
  };
}