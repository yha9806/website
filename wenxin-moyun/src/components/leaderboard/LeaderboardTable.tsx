import React, { useMemo, useState, Suspense, lazy } from 'react';
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
import type { VULCAEvaluation, VULCAScore6D } from '../../types/vulca';
import { exportData } from '../../utils/dataExport';
import RouterLink from '../common/RouterLink';
import { VULCA_47_DIMENSIONS, getDimensionLabel } from '../../utils/vulca-dimensions';
import { vulcaDataManager } from '../../services/vulcaDataManager';

// 懒加载VULCA可视化组件
const VULCAVisualization = lazy(() => 
  import('../vulca/VULCAVisualization').then(module => ({
    default: module.VULCAVisualization
  }))
);

// VULCA数据显示组件
interface VULCADataDisplayProps {
  model: any;
  score: number | null;
  convertToEvaluation: (model: any) => Promise<VULCAEvaluation>;
  getDefaultDimensions: (scores: any) => any[];
  calculate47DAverage: (scores: any) => number | null;
}

const VULCADataDisplay: React.FC<VULCADataDisplayProps> = ({
  model,
  score,
  convertToEvaluation,
  getDefaultDimensions,
  calculate47DAverage
}) => {
  const [evaluation, setEvaluation] = useState<VULCAEvaluation | null>(null);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  React.useEffect(() => {
    const loadVulcaData = async () => {
      try {
        setLoading(true);
        const evalData = await convertToEvaluation(model);
        setEvaluation(evalData);
        setDimensions(getDefaultDimensions(evalData.scores47D));
        setError(null);
      } catch (err) {
        console.error('Error loading VULCA data:', err);
        setError('Failed to load VULCA data');
      } finally {
        setLoading(false);
      }
    };
    
    loadVulcaData();
  }, [model.id]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-slate-700 dark:border-t-slate-500 rounded-full animate-spin" />
          Loading VULCA Analysis...
        </div>
      </div>
    );
  }
  
  if (error || !evaluation) {
    return (
      <div className="p-8 text-center text-red-500">
        {error || 'No VULCA data available for this model'}
      </div>
    );
  }
  
  const vulcaAverage = calculate47DAverage(evaluation.scores47D);
  
  return (
    <div className="space-y-4">
      {/* 分数说明 */}
      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Overall Score</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {score != null ? score.toFixed(3) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">VULCA 47D Average</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-500">
              {vulcaAverage != null ? vulcaAverage.toFixed(1) : 'N/A'}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
          <p><strong>Overall Score</strong> is the model's comprehensive evaluation score.</p>
          <p><strong>VULCA 47D Average</strong> is the mean of all 47 dimension scores.</p>
        </div>
      </div>
      
      {/* VULCA可视化 */}
      <VULCAVisualization
        evaluations={[evaluation]}
        dimensions={dimensions}
        viewMode="47d"
        visualizationType="radar"
        culturalPerspective="eastern"
      />
    </div>
  );
};

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  loading?: boolean;
  onRowClick?: (entry: LeaderboardEntry) => void;
  expandedVulcaModels?: Set<string>;
  onToggleVulca?: (modelId: string) => void;
}

const columnHelper = createColumnHelper<LeaderboardEntry>();

export default function LeaderboardTable({ 
  data, 
  loading, 
  onRowClick, 
  expandedVulcaModels = new Set(), 
  onToggleVulca 
}: LeaderboardTableProps) {
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
            aria-label="Select all rows"
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
            aria-label={`Select ${row.original.model?.name || 'row'}`}
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
            className="flex items-center gap-3 group hover:text-slate-700 dark:hover:text-slate-500"
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
          if (rate >= 50) return 'text-slate-700 dark:text-slate-500';
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
        if (change === 0) return <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-auto" />;
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
      size: 150,
      header: '',
      cell: ({ row }) => {
        const modelId = row.original.model.id;
        const hasVulca = row.original.model.vulca_scores_47d != null;
        const isExpanded = expandedVulcaModels.has(modelId);
        
        return (
          <div className="flex items-center justify-center gap-2">
            {hasVulca && onToggleVulca && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVulca(modelId);
                }}
                className="px-2 py-1 text-sm bg-amber-700 dark:bg-amber-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-amber-700 transition-colors flex items-center gap-1"
                title="View VULCA 47D Analysis"
              >
                47D
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
            <RouterLink
              to={`/model/${modelId}`}
              className="px-3 py-1 text-sm bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors"
            >
              View
            </RouterLink>
          </div>
        );
      },
    }),
  ], [expandedVulcaModels, onToggleVulca]);

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
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            aria-label="Search models"
            placeholder="Search models..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-3 py-2 ios-glass backdrop-blur-sm border border-gray-200 dark:border-[#30363D] rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600/40 focus:border-slate-600 dark:focus:border-slate-500"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900/20 rounded-lg"
            >
              <span className="text-sm text-slate-700 dark:text-slate-500">
                {selectedRows.length} items selected
              </span>
              <button
                onClick={() => {
                  const selectedData = selectedRows.map(row => row.original);
                  // TODO: 实现对比功能
                  console.log('Compare:', selectedData);
                }}
                className="text-sm text-slate-700 dark:text-slate-500 hover:underline"
              >
                Compare
              </button>
            </motion.div>
          )}

          {/* 导出按钮 */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 min-h-[44px] bg-gray-100 dark:bg-[#21262D] rounded-lg hover:bg-gray-200 dark:hover:bg-[#30363D] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
            <div className="absolute right-0 mt-2 w-32 ios-glass backdrop-blur-md border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => exportData(data, 'csv')}
                className="w-full px-3 py-2 min-h-[44px] text-sm text-left hover:bg-gray-100/30 dark:hover:bg-[#262C36] focus:outline-none focus:bg-gray-100/50 dark:focus:bg-[#262C36] transition-colors flex items-center"
              >
                Export as CSV
              </button>
              <button
                onClick={() => exportData(data, 'json')}
                className="w-full px-3 py-2 min-h-[44px] text-sm text-left hover:bg-gray-100/30 dark:hover:bg-[#262C36] focus:outline-none focus:bg-gray-100/50 dark:focus:bg-[#262C36] transition-colors flex items-center"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="leaderboard-table overflow-x-auto ios-glass liquid-glass-container rounded-lg border border-gray-200 dark:border-[#30363D]">
        <table className="w-full">
          <caption className="sr-only">AI Model Leaderboard Rankings with scores and metrics</caption>
          <thead className="ios-glass backdrop-blur-sm border-b border-gray-200 dark:border-[#30363D]">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    scope="col"
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
                  <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-slate-700 dark:border-t-slate-500 rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => {
                const modelId = row.original.model.id;
                const isExpanded = expandedVulcaModels?.has(modelId);
                const hasVulcaData = row.original.model.vulca_scores_47d != null;
                
                // 解析VULCA数据
                const parseVulcaData = (vulcaScores: any) => {
                  if (!vulcaScores) return null;
                  if (typeof vulcaScores === 'string') {
                    try {
                      return JSON.parse(vulcaScores);
                    } catch {
                      return null;
                    }
                  }
                  return vulcaScores;
                };
                
                const parseCulturalPerspectives = (perspectives: any) => {
                  if (!perspectives) return null;
                  if (typeof perspectives === 'string') {
                    try {
                      return JSON.parse(perspectives);
                    } catch {
                      return null;
                    }
                  }
                  return perspectives;
                };
                
                // 从47维中提取6个核心维度
                const extractScores6D = (scores47D: any): VULCAScore6D => {
                  const defaultScores: VULCAScore6D = {
                    creativity: 0,
                    technique: 0,
                    emotion: 0,
                    context: 0,
                    innovation: 0,
                    impact: 0
                  };
                  if (!scores47D) return defaultScores;
                  return {
                    creativity: scores47D.creativity || scores47D.originality || scores47D.imagination || 0,
                    technique: scores47D.technique || scores47D.precision || scores47D.skill_level || 0,
                    emotion: scores47D.emotion || scores47D.emotional_depth || scores47D.emotional_resonance || 0,
                    context: scores47D.context || scores47D.relevance || scores47D.contextual_awareness || 0,
                    innovation: scores47D.innovation || scores47D.uniqueness || scores47D.novelty || 0,
                    impact: scores47D.impact || scores47D.influence || scores47D.significance || 0
                  };
                };
                
                // 转换单个模型数据为VULCAEvaluation格式
                const convertToEvaluation = async (model: any): Promise<VULCAEvaluation> => {
                  // 使用VULCADataManager获取完整的VULCA数据
                  const evaluation = await vulcaDataManager.getModelVULCAData(
                    model.id.toString(),
                    model.name || 'Unknown Model'
                  );
                  
                  // 如果后端有实际数据，合并使用
                  const rawScores = parseVulcaData(model.vulca_scores_47d);
                  if (rawScores && Object.keys(rawScores).length > 0) {
                    evaluation.scores47D = rawScores;
                    evaluation.scores6D = extractScores6D(rawScores);
                  }
                  
                  const culturalPerspectives = parseCulturalPerspectives(model.vulca_cultural_perspectives);
                  if (culturalPerspectives && Object.keys(culturalPerspectives).length > 0) {
                    evaluation.culturalPerspectives = culturalPerspectives;
                  }
                  
                  return evaluation;
                };
                
                // 从VULCA分数生成维度定义，使用真实的47维度名称
                const getDefaultDimensions = (scores: any) => {
                  if (!scores || typeof scores !== 'object') return [];
                  
                  return Object.keys(scores).map(key => {
                    // 确保使用getDimensionLabel获取正确的显示名称（带空格）
                    const labelResult = getDimensionLabel(key);
                    // 如果getDimensionLabel返回的还是没有空格的格式，则尝试其他方法
                    const properName = labelResult === key ? 
                      // 将camelCase转换为带空格的格式作为后备方案
                      key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^[a-z]/, c => c.toUpperCase()) 
                      : labelResult;
                    
                    return {
                      id: key,
                      name: properName,
                      description: `${properName} dimension`
                    };
                  });
                };
                
                // 计算47D平均分
                const calculate47DAverage = (scores: any) => {
                  if (!scores || typeof scores !== 'object') return null;
                  const values = Object.values(scores).filter(v => typeof v === 'number');
                  if (values.length === 0) return null;
                  return values.reduce((sum: number, val: any) => sum + val, 0) / values.length;
                };
                
                return (
                  <React.Fragment key={row.id}>
                    <tr 
                      className="hover:bg-gray-100/20 dark:hover:bg-[#1C2128] transition-colors cursor-pointer"
                      onClick={(e) => {
                        // 防止点击47D按钮时触发行点击
                        if (!(e.target as HTMLElement).closest('button')) {
                          onRowClick?.(row.original);
                        }
                      }}
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
                    
                    {/* VULCA展开行 */}
                    {isExpanded && hasVulcaData && (
                      <tr className="vulca-visualization">
                        <td colSpan={columns.length} className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gray-50 dark:bg-[#0d1117] border-t border-gray-200 dark:border-[#30363D]"
                          >
                            <div className="p-6">
                              <Suspense fallback={
                                <div className="flex items-center justify-center py-8">
                                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-slate-700 dark:border-t-slate-500 rounded-full animate-spin" />
                                    Loading VULCA Analysis...
                                  </div>
                                </div>
                              }>
                                <VULCADataDisplay
                                  model={row.original.model}
                                  score={row.original.score}
                                  convertToEvaluation={convertToEvaluation}
                                  getDefaultDimensions={getDefaultDimensions}
                                  calculate47DAverage={calculate47DAverage}
                                />
                                    
                              </Suspense>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
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
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="px-3 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}