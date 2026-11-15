import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Search, ArrowUpDown, Download, Table, Layers } from 'lucide-react';

export default function CsvSpreadsheetReader({ file }) {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    if (file && file.content) {
      const parsed = Papa.parse(file.content.trim(), {
        header: true,
        skipEmptyLines: true,
      });
      if (parsed.meta && parsed.meta.fields) {
        setColumns(parsed.meta.fields);
        setData(parsed.data);
      }
    }
  }, [file]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(q))
    );
  }, [data, search]);

  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortCol] || '';
      const valB = b[sortCol] || '';
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortAsc ? numA - numB : numB - numA;
      }
      return sortAsc 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortCol, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const pageRows = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden shadow-sm">
      {/* Top CSV Toolbar */}
      <div className="p-3 bg-surface-container-low flex flex-wrap items-center justify-between gap-2 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display text-xs font-bold text-primary">PapaParse Tabular Engine</span>
            <p className="text-[10px] text-on-surface-variant">
              {data.length} rows • {columns.length} columns • In-Memory Indexed
            </p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative flex items-center min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-outline absolute left-2.5" />
          <input
            type="text"
            placeholder="Search cells..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-8 pr-2 py-1 text-xs bg-surface-container-lowest rounded-lg border border-outline-variant/60 focus:outline-none focus:border-secondary font-mono"
          />
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container text-on-surface-variant font-semibold border-b border-surface-container-high">
              <th className="p-2.5 font-mono text-[10px] text-outline text-center w-10">#</th>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="p-2.5 font-mono text-[11px] hover:text-primary cursor-pointer select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{col}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low font-mono">
            {pageRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="p-2.5 text-[10px] text-outline text-center">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                {columns.map(col => {
                  const val = row[col];
                  const isVerified = String(val).includes('VERIFIED');
                  const isNegative = String(val).startsWith('-');
                  const isPositive = String(val).startsWith('+');

                  return (
                    <td key={col} className="p-2.5 whitespace-nowrap">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          {val}
                        </span>
                      ) : (
                        <span className={`${isNegative ? 'text-emerald-700 font-semibold' : ''} ${isPositive ? 'text-amber-700 font-semibold' : ''}`}>
                          {val}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-6 text-center text-on-surface-variant">
                  No matching cells found for "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-2.5 bg-surface-container-low flex items-center justify-between text-xs text-on-surface-variant border-t border-surface-container font-mono">
        <span>
          Page {currentPage} of {totalPages} ({sortedData.length} total)
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

