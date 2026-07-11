import { useState, useMemo } from 'react';

export function usePagination<T>(data: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const maxPage = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  // Ensure current page is within valid bounds if data length changes
  const safeCurrentPage = Math.min(currentPage, maxPage);
  
  const currentData = useMemo(() => {
    const begin = (safeCurrentPage - 1) * itemsPerPage;
    const end = begin + itemsPerPage;
    return data.slice(begin, end);
  }, [data, safeCurrentPage, itemsPerPage]);

  const next = () => setCurrentPage((prev) => Math.min(prev + 1, maxPage));
  const prev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const jump = (page: number) => setCurrentPage(Math.max(1, Math.min(page, maxPage)));
  const setPage = (page: number) => jump(page);

  return { next, prev, jump, setPage, currentData, currentPage: safeCurrentPage, maxPage };
}
