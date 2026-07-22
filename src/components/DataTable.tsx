import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from './Pagination';

export interface Column<T = any> {
  key: string;
  label: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  filterable?: boolean;
}

interface DataTableProps<T = any> {
  title?: string;
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  itemsPerPage = 10,
  emptyMessage = 'Data tidak ditemukan.'
}: DataTableProps<T>) {
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenFilterKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGlobalSearch = () => {
    setGlobalSearch(globalSearchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGlobalSearch();
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Global Search
      if (globalSearch) {
        const matchesGlobal = JSON.stringify(item).toLowerCase().includes(globalSearch.toLowerCase());
        if (!matchesGlobal) return false;
      }

      // 2. Column Filters
      for (const col of columns) {
        if (col.filterable && columnFilters[col.key]) {
          const filterValue = columnFilters[col.key].toLowerCase();
          let cellValue = '';
          
          // Special handling if there's a custom render that we can't stringify easily
          // We fall back to the raw data value for filtering.
          if (item[col.key] !== undefined && item[col.key] !== null) {
            cellValue = String(item[col.key]).toLowerCase();
          } else {
            // If the key doesn't exist directly on item, stringify the whole item as fallback
            cellValue = JSON.stringify(item).toLowerCase();
          }

          if (!cellValue.includes(filterValue)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, globalSearch, columnFilters, columns]);

  const pagination = usePagination(filteredData, itemsPerPage);

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearColumnFilter = (key: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    setOpenFilterKey(null);
  };

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl shadow-xl shadow-neutral-200/40 overflow-hidden relative">
      {/* Header & Global Search */}
      <div className="p-4 sm:p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/50">
        {title && <h3 className="font-bold text-lg text-neutral-800">{title}</h3>}
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Cari data..."
              value={globalSearchInput}
              onChange={(e) => setGlobalSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#EAB308] outline-none"
            />
          </div>
          <button 
            onClick={handleGlobalSearch}
            className="w-full sm:w-auto px-5 py-2 bg-neutral-900 text-[#EAB308] font-bold rounded-xl text-sm hover:bg-neutral-800 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[300px] relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b-2 border-neutral-100">
              {columns.map((col, idx) => (
                <th key={idx} className="py-4 px-4 sm:px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider relative align-top">
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.filterable && (
                      <button 
                        onClick={() => setOpenFilterKey(openFilterKey === col.key ? null : col.key)}
                        className={`p-1 rounded-md transition-colors ${columnFilters[col.key] ? 'bg-[#EAB308]/20 text-[#A16207]' : 'hover:bg-neutral-100 text-neutral-400'}`}
                        title={`Filter ${col.label}`}
                      >
                        <Filter className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Filter Popover */}
                  {col.filterable && openFilterKey === col.key && (
                    <div ref={filterRef} className="absolute z-20 top-full left-4 mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-neutral-700 normal-case">Filter {col.label}</span>
                        <button onClick={() => setOpenFilterKey(null)} className="text-neutral-400 hover:text-neutral-700">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder="Masukkan kata kunci..."
                        value={columnFilters[col.key] || ''}
                        onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                        className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:ring-2 focus:ring-[#EAB308] outline-none font-normal normal-case mb-2"
                      />
                      <button 
                        onClick={() => clearColumnFilter(col.key)}
                        className="w-full py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {pagination.currentData.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-neutral-50/50 transition-colors group">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="py-4 px-4 sm:px-6 text-sm font-medium text-neutral-700 align-top">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {pagination.currentData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-neutral-500 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <Pagination {...pagination} />
    </div>
  );
}
