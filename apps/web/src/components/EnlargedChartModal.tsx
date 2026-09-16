import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Download,
  Table as TableIcon,
  BarChart2,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Laptop,
  Columns,
  RotateCcw,
} from 'lucide-react';
import { NavTab } from './Sidebar';

export interface EnlargedChartKpi {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  color?: string;
  filterKey?: string; // e.g., 'ALL', 'ASSIGNED', 'IN_STOCK', 'IN_REPAIR'
  targetTab?: NavTab;
  targetParams?: Record<string, any>;
}

export interface EnlargedChartColumn {
  key: string;
  label: string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface EnlargedChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  kpis?: EnlargedChartKpi[];
  children: React.ReactNode;
  tableData?: any[];
  tableColumns?: EnlargedChartColumn[];
  // Interactive Asset Drilldown & Navigation
  detailedAssets?: any[];
  activeFilterKey?: string;
  onFilterSelect?: (filterKey: string) => void;
  onJumpToModule?: (tab: NavTab, params?: any) => void;
  jumpLabel?: string;
  jumpTab?: NavTab;
}

export const EnlargedChartModal: React.FC<EnlargedChartModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge = 'Interactive Deep-Dive',
  kpis,
  children,
  tableData,
  tableColumns,
  detailedAssets,
  activeFilterKey: externalActiveFilter,
  onFilterSelect,
  onJumpToModule,
  jumpLabel = 'Jump to Fleet Inventory',
  jumpTab = 'itam',
}) => {
  const [internalActiveFilter, setInternalActiveFilter] = useState<string>('ALL');
  const activeFilter = externalActiveFilter !== undefined ? externalActiveFilter : internalActiveFilter;

  const [activeView, setActiveView] = useState<'chart' | 'table' | 'split'>('chart');
  const [isExpanded, setIsExpanded] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync external filter changes
  useEffect(() => {
    if (externalActiveFilter !== undefined) {
      setInternalActiveFilter(externalActiveFilter);
    }
  }, [externalActiveFilter]);

  // Filter detailed assets if available
  const filteredAssets = useMemo(() => {
    if (!detailedAssets || detailedAssets.length === 0) return [];
    let list = detailedAssets;

    if (activeFilter && activeFilter !== 'ALL') {
      list = list.filter((a) => {
        const itemStatus = (a.status || '').toUpperCase();
        const filter = activeFilter.toUpperCase();
        if (filter === 'ASSIGNED') return itemStatus === 'ASSIGNED';
        if (filter === 'IN_STOCK' || filter === 'BUFFER') return itemStatus === 'IN_STOCK';
        if (filter === 'IN_REPAIR' || filter === 'REPAIR') return itemStatus === 'IN_REPAIR';
        if (filter === 'RETIRED') return itemStatus === 'RETIRED';
        return itemStatus === filter || (a.category && a.category.toUpperCase() === filter);
      });
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (a) =>
          (a.assetTag || '').toLowerCase().includes(q) ||
          (a.name || '').toLowerCase().includes(q) ||
          (a.model || '').toLowerCase().includes(q) ||
          (a.serialNumber || '').toLowerCase().includes(q) ||
          (a.assignedToEmployeeName || '').toLowerCase().includes(q) ||
          (a.category || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [detailedAssets, activeFilter, tableSearch]);

  if (!isOpen) return null;

  const handleKpiClick = (kpi: EnlargedChartKpi) => {
    const nextFilter = kpi.filterKey || (kpi.label.includes('Deployed') ? 'ASSIGNED' : kpi.label.includes('Buffer') || kpi.label.includes('Stock') ? 'IN_STOCK' : kpi.label.includes('Repair') ? 'IN_REPAIR' : 'ALL');
    setInternalActiveFilter(nextFilter);
    if (onFilterSelect) {
      onFilterSelect(nextFilter);
    }
    // Auto-switch to split view if user clicks a specific filter so they see the assets immediately
    if (detailedAssets && detailedAssets.length > 0 && activeView === 'chart' && nextFilter !== 'ALL') {
      setActiveView('split');
    }
  };

  const handleJump = () => {
    if (!onJumpToModule) return;
    const targetStatus = activeFilter !== 'ALL' ? activeFilter : undefined;
    onJumpToModule(jumpTab, { status: targetStatus });
    onClose();
  };

  const handleExportCsv = () => {
    const dataToExport = detailedAssets && detailedAssets.length > 0 ? filteredAssets : tableData;
    if (!dataToExport || dataToExport.length === 0) return;

    let headers: string[];
    let keys: string[];

    if (detailedAssets && detailedAssets.length > 0) {
      headers = ['Asset Tag', 'Name', 'Category', 'Model', 'Serial Number', 'Status', 'Assigned To'];
      keys = ['assetTag', 'name', 'category', 'model', 'serialNumber', 'status', 'assignedToEmployeeName'];
    } else if (tableColumns) {
      headers = tableColumns.map((c) => c.label);
      keys = tableColumns.map((c) => c.key);
    } else {
      headers = Object.keys(dataToExport[0]);
      keys = headers;
    }

    const csvRows = [
      headers.join(','),
      ...dataToExport.map((row: any) =>
        keys.map((k) => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${activeFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = (detailedAssets && detailedAssets.length > 0) || (tableData && tableData.length > 0);

  return (
    <div
      onClick={(e) => {
        // Dismiss if clicking directly on the backdrop outside modal window
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 cursor-default ${
          isExpanded ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-6xl max-h-[92vh]'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
              title="Return to Dashboard (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Back</span>
              <kbd className="hidden md:inline px-1 py-0.2 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-400 font-mono">
                Esc
              </kbd>
            </button>

            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">{title}</h3>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold">
                  {badge}
                </span>
              </div>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher Tabs */}
            {hasData && (
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 mr-2">
                <button
                  onClick={() => setActiveView('chart')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                    activeView === 'chart'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Full Chart View"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Chart View</span>
                </button>
                <button
                  onClick={() => setActiveView('split')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                    activeView === 'split'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Side-by-Side Chart & Data Table"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Split View</span>
                </button>
                <button
                  onClick={() => setActiveView('table')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                    activeView === 'table'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Data Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Asset Table</span>
                </button>
              </div>
            )}

            {/* CSV Export Button */}
            {hasData && (
              <button
                onClick={handleExportCsv}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                title="Export Filtered Data to CSV"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">CSV Export</span>
              </button>
            )}

            {/* Expand / Minimize Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title={isExpanded ? 'Restore View' : 'Full Screen'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Close and Return to Dashboard (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Clickable KPI Filter Strip */}
        {kpis && kpis.length > 0 && (
          <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800">
            <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1 font-semibold">
                <Filter className="w-3 h-3 text-indigo-400" />
                <span>Interactive Telemetry Filters (Click a card to filter records & jump):</span>
              </span>
              {activeFilter !== 'ALL' && (
                <button
                  onClick={() => {
                    setInternalActiveFilter('ALL');
                    if (onFilterSelect) onFilterSelect('ALL');
                  }}
                  className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to All</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kpis.map((kpi, idx) => {
                const kpiFilter = kpi.filterKey || (kpi.label.includes('Deployed') ? 'ASSIGNED' : kpi.label.includes('Buffer') || kpi.label.includes('Stock') ? 'IN_STOCK' : kpi.label.includes('Repair') ? 'IN_REPAIR' : 'ALL');
                const isSelected = activeFilter === kpiFilter;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleKpiClick(kpi)}
                    className={`p-3 rounded-xl text-left transition-all duration-200 cursor-pointer transform-gpu hover:scale-[1.02] hover:-translate-y-0.5 ${
                      isSelected
                        ? 'bg-indigo-950/70 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/50'
                        : 'bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">{kpi.label}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded text-[9px] font-bold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className={`text-base font-bold ${kpi.color || 'text-slate-100'}`}>
                        {kpi.value}
                      </span>
                      {kpi.change && (
                        <span
                          className={`text-[10px] font-semibold flex items-center ${
                            kpi.isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {kpi.isPositive ? (
                            <ArrowUpRight className="w-3 h-3 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 mr-0.5" />
                          )}
                          {kpi.change}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Action Filter Banner with Direct Jump Button */}
        {onJumpToModule && (
          <div className="px-6 py-2.5 bg-indigo-950/30 border-b border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {activeFilter === 'ALL'
                  ? `Showing complete fleet of ${detailedAssets?.length || tableData?.length || 0} tracked assets.`
                  : `Filtered by ${activeFilter}: Showing ${filteredAssets.length} matching hardware assets.`}
              </span>
            </div>

            <button
              onClick={handleJump}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition-all transform hover:scale-[1.02]"
              title={`Navigate to ${jumpTab.toUpperCase()} with pre-applied filter`}
            >
              <span>{jumpLabel}</span>
              {activeFilter !== 'ALL' && (
                <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px] uppercase font-mono">
                  {activeFilter}
                </span>
              )}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-center">
          {/* 1. Chart View */}
          {activeView === 'chart' && (
            <div className="w-full h-[450px] sm:h-[520px] flex items-center justify-center">
              {children}
            </div>
          )}

          {/* 2. Split View (Side by Side) */}
          {activeView === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-6 h-[440px] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 pr-0 lg:pr-4">
                {children}
              </div>
              <div className="lg:col-span-6 flex flex-col max-h-[460px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">
                    Filtered Hardware Assets ({filteredAssets.length})
                  </span>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-y-auto max-h-[410px]">
                  {renderAssetOrDataTable(
                    detailedAssets && detailedAssets.length > 0 ? filteredAssets : tableData,
                    tableColumns,
                    detailedAssets && detailedAssets.length > 0,
                    handleJump
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. Full Table View */}
          {activeView === 'table' && (
            <div className="flex flex-col flex-1 max-h-[520px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200">
                  {detailedAssets && detailedAssets.length > 0
                    ? `Showing ${filteredAssets.length} of ${detailedAssets.length} Assets`
                    : `Data Records (${tableData?.length || 0})`}
                </span>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by tag, model, serial, user..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-y-auto max-h-[460px] shadow-inner">
                {renderAssetOrDataTable(
                  detailedAssets && detailedAssets.length > 0 ? filteredAssets : tableData,
                  tableColumns,
                  detailedAssets && detailedAssets.length > 0,
                  handleJump
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Anti-aliased vector rendering with dynamic sub-second telemetry filters.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition"
            >
              Close & Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper renderer for Asset Records Table
function renderAssetOrDataTable(
  data: any[] | undefined,
  tableColumns?: EnlargedChartColumn[],
  isDetailedAssets?: boolean,
  onJump?: () => void
) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40">
        No asset records match the active filter.
      </div>
    );
  }

  if (isDetailedAssets) {
    return (
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950/90 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
          <tr>
            <th className="px-4 py-2.5">Asset Tag</th>
            <th className="px-4 py-2.5">Hardware Item / Model</th>
            <th className="px-4 py-2.5">Category</th>
            <th className="px-4 py-2.5">Serial Number</th>
            <th className="px-4 py-2.5">Custody / Assigned To</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
          {data.map((asset, idx) => (
            <tr key={asset.id || idx} className="hover:bg-slate-800/40 transition">
              <td className="px-4 py-2.5 font-mono font-bold text-indigo-300">
                {asset.assetTag}
              </td>
              <td className="px-4 py-2.5 font-medium text-slate-100">
                {asset.name || asset.model}
                {asset.brand && <span className="text-slate-400 text-[11px] ml-1">({asset.brand})</span>}
              </td>
              <td className="px-4 py-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {asset.category}
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px]">
                {asset.serialNumber || '—'}
              </td>
              <td className="px-4 py-2.5">
                {asset.status === 'ASSIGNED' ? (
                  <span className="text-blue-300 font-medium">
                    {asset.assignedToEmployeeName || 'Active Staff'}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Warehouse Ready</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    asset.status === 'ASSIGNED'
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                      : asset.status === 'IN_STOCK'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : asset.status === 'IN_REPAIR'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}
                >
                  {asset.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <button
                  onClick={onJump}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded text-[11px] font-semibold border border-slate-700 transition"
                  title="View in Fleet Inventory"
                >
                  Inspect ↗
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full text-left text-xs text-slate-300">
      <thead className="bg-slate-950/90 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
        <tr>
          {tableColumns
            ? tableColumns.map((col) => (
                <th key={col.key} className="px-4 py-2.5 font-semibold">
                  {col.label}
                </th>
              ))
            : Object.keys(data[0] || {}).map((k) => (
                <th key={k} className="px-4 py-2.5 font-semibold capitalize">
                  {k}
                </th>
              ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-slate-800/40 transition">
            {tableColumns
              ? tableColumns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))
              : Object.keys(row).map((k) => (
                  <td key={k} className="px-4 py-2.5">
                    {row[k]?.toString() ?? '—'}
                  </td>
                ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
