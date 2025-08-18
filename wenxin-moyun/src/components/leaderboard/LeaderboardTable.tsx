import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Download,
  Filter,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '../../types/types';
import { exportData } from '../../utils/dataExport';
import RouterLink from '../common/RouterLink';

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  loading?: boolean;
  onRowClick?: (entry: LeaderboardEntry) => void;
}

const columnHelper = createColumnHelper<LeaderboardEntry>();

export default function LeaderboardTable({ data, loading, onRowClick }: LeaderboardTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  // 定义表格列
  const columns = useMemo(() => [
    // 选择列
    columnHelper.display({
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <div className="px-1">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        </div>
      ),
    }),

    // 排名列
    columnHelper.accessor('rank', {
      header: 'Rank',
      size: 80,
      cell: ({ getValue }) => {
        const rank = getValue();
        const getRankStyle = () => {
          if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
          if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
          if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
          return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        };
        
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankStyle()}`}>
              {rank <= 3 ? <Trophy className="w-4 h-4" /> : rank}
            </span>
          </div>
        );
      },
    }),

    // 模型信息列
    columnHelper.accessor('model.name', {
      id: 'model',
      header: 'Model',
      size: 250,
      cell: ({ row }) => {
        const model = row.original.model;
        return (
          <RouterLink 
            to={`/model/${model.id}`}
            className="flex items-center gap-3 group hover:text-blue-600 dark:hover:text-blue-400"
          >
            <img 
              src={model.avatar} 
              alt={model.name}
              className="w-10 h-10 rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
            />
            <div>
              <div className="font-medium">{model.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{model.organization}</div>
            </div>
          </RouterLink>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        const model = row.original.model;
        const searchLower = filterValue.toLowerCase();
        return model.name.toLowerCase().includes(searchLower) ||
               model.organization.toLowerCase().includes(searchLower);
      },
    }),

    // 综合分数列
    columnHelper.accessor('score', {
      header: 'Overall Score',
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <div className="text-center font-semibold text-lg">
            {value != null ? value.toFixed(3) : 'N/A'}
          </div>
        );
      },
    }),

    // 各项指标列
    columnHelper.accessor('model.metrics.rhythm', {
      header: 'Poetry',
      size: 80,
      cell: ({ getValue }) => (
        <div className="text-center">{getValue()}</div>
      ),
    }),

    columnHelper.accessor('model.metrics.composition', {
      header: 'Painting',
      size: 80,
      cell: ({ getValue }) => (
        <div className="text-center">{getValue()}</div>
      ),
    }),

    columnHelper.accessor('model.metrics.narrative', {
      header: 'Narrative',
      size: 80,
      cell: ({ getValue }) => (
        <div className="text-center">{getValue()}</div>
      ),
    }),

    // 胜率列
    columnHelper.accessor('winRate', {
      header: 'Win Rate',
      size: 100,
      cell: ({ getValue }) => {
        const rate = getValue();
        const getColor = () => {
          if (rate >= 70) return 'text-green-600 dark:text-green-400';
          if (rate >= 50) return 'text-blue-600 dark:text-blue-400';
          return 'text-gray-600 dark:text-gray-400';
        };
        
        return (
          <div className={`text-center font-medium ${getColor()}`}>
            {rate != null ? `${rate.toFixed(1)}%` : 'N/A'}
          </div>
        );
      },
    }),

    // 对战数列
    columnHelper.accessor('battles', {
      header: 'Battles',
      size: 80,
      cell: ({ getValue }) => (
        <div className="text-center">{getValue()}</div>
      ),
    }),

    // 趋势列
    columnHelper.accessor('change', {
      header: 'Trend',
      size: 80,
      cell: ({ getValue }) => {
        const change = getValue();
        if (change === 0) return <Minus className="w-4 h-4 text-gray-400 mx-auto" />;
        if (change > 0) {
          return (
            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{change}</span>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">{Math.abs(change)}</span>
          </div>
        );
      },
    }),

    // 操作列
    columnHelper.display({
      id: 'actions',
      size: 100,
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <RouterLink
            to={`/model/${row.original.model.id}`}
            className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            View
          </RouterLink>
        </div>
      ),
    }),
  ], []);

  // 创建表格实例
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // 获取选中的行
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="w-full space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 ios-glass liquid-glass-container rounded-lg border border-gray-200 dark:border-[#30363D]">
        {/* 搜索框 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-3 py-2 ios-glass backdrop-blur-sm border border-gray-200 dark:border-[#30363D] rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {selectedRows.length} items selected
              </span>
              <button
                onClick={() => {
                  const selectedData = selectedRows.map(row => row.original);
                  // TODO: 实现对比功能
                  console.log('Compare:', selectedData);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Compare
              </button>
            </motion.div>
          )}

          {/* 导出按钮 */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#21262D] rounded-lg hover:bg-gray-200 dark:hover:bg-[#30363D] transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
            <div className="absolute right-0 mt-2 w-32 ios-glass backdrop-blur-md border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => exportData(data, 'csv')}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100/30 dark:hover:bg-[#262C36] transition-colors"
              >
                Export as CSV
              </button>
              <button
                onClick={() => exportData(data, 'json')}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100/30 dark:hover:bg-[#262C36] transition-colors"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto ios-glass liquid-glass-container rounded-lg border border-gray-200 dark:border-[#30363D]">
        <table className="w-full">
          <thead className="ios-glass backdrop-blur-sm border-b border-gray-200 dark:border-[#30363D]">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <>
                            {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-4 h-4" />}
                            {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-4 h-4" />}
                            {!header.column.getIsSorted() && <ChevronsUpDown className="w-4 h-4 opacity-30" />}
                          </>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#30363D]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  No data
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id}
                  className="hover:bg-gray-100/20 dark:hover:bg-[#1C2128] transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id}
                      className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页控制 */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of {data.length}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="px-3 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}