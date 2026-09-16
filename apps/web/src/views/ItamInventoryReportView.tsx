import React, { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  PackagePlus,
  Settings,
  BarChart3,
  PieChart as PieIcon,
  ScanLine,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../api';
import { MasterCatalogModal } from '../components/MasterCatalogModal';
import { AssetInwardingModal } from '../components/AssetInwardingModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

interface ItamInventoryReportViewProps {
  initialCategoryFilter?: string;
}

export const ItamInventoryReportView: React.FC<ItamInventoryReportViewProps> = ({ initialCategoryFilter }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [stockReport, setStockReport] = useState<any[]>([]);
  const [depreciationLedger, setDepreciationLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'buffers' | 'stock' | 'depreciation'>(
    initialCategoryFilter ? 'stock' : 'buffers'
  );
  const [searchQuery, setSearchQuery] = useState(initialCategoryFilter || '');

  useEffect(() => {
    if (initialCategoryFilter) {
      setSearchQuery(initialCategoryFilter);
      setActiveTab('stock');
    }
  }, [initialCategoryFilter]);
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  const fetchInventoryData = async () => {
    try {
      setIsLoading(true);
      const [mRes, sRes, dRes] = await Promise.all([
        api.get('/itam/inventory/metrics'),
        api.get('/itam/inventory/stock-report'),
        api.get('/itam/inventory/depreciation'),
      ]);
      setMetrics(mRes.data);
      setStockReport(sRes.data);
      setDepreciationLedger(dRes.data);
    } catch (err) {
      console.error('Failed to load ITAM inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleExportCsv = () => {
    if (!depreciationLedger.length) return;
    const headers = [
      'Asset Tag',
      'Name',
      'Category',
      'Brand',
      'Model',
      'Serial Number',
      'Purchase Date',
      'Purchase Cost',
      'Age (Months)',
      'Monthly Depreciation',
      'Accumulated Depreciation',
      'Net Book Value (NBV)',
      'Depreciation %',
      'Custodian',
      'Location',
    ];

    const rows = depreciationLedger.map((d) => [
      d.assetTag,
      `"${d.name.replace(/"/g, '""')}"`,
      d.category,
      d.brand,
      d.model,
      d.serialNumber,
      d.purchaseDate,
      d.purchaseCost,
      d.ageInMonths,
      d.monthlyDepreciation,
      d.accumulatedDepreciation,
      d.netBookValue,
      `${d.depreciationPercent}%`,
      `"${d.custodian.replace(/"/g, '""')}"`,
      d.location,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EmpOps_Asset_Depreciation_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !metrics) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Aggregating hardware inventory telemetry...</p>
        </div>
      </div>
    );
  }

  // Derived Datasets for Recharts Visualizations
  const categoryChartData = metrics?.categoryBuffers?.map((b: any) => ({
    category: b.category,
    inStock: b.inStock,
    minBuffer: b.minBuffer,
    total: b.total,
  })) || [];

  const statusChartData = [
    { name: 'Assigned', value: metrics.assignedCount, color: '#6366f1' },
    { name: 'In Stock', value: metrics.inStockCount, color: '#10b981' },
    { name: 'In Repair', value: metrics.inRepairCount, color: '#f59e0b' },
    { name: 'Retired', value: metrics.retiredCount, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const totalCapEx = metrics.financials?.totalCapEx || 600000;
  const depreciationTimeline = [0, 6, 12, 18, 24, 30, 36].map((m) => {
    const residualFactor = 0.1;
    const depreciatedFactor = Math.max(residualFactor, 1 - (m / 36) * (1 - residualFactor));
    const nbv = Math.round(totalCapEx * depreciatedFactor);
    return {
      month: m === 0 ? 'M0 (New)' : m === 36 ? 'M36 (EOL)' : `Month ${m}`,
      capEx: totalCapEx,
      netBookValue: nbv,
    };
  });

  const filteredDepreciation = depreciationLedger.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.custodian.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>IT Inventory & Stock Telemetry</span>
              <span className="px-2 py-0.5 text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full font-semibold">
                Live Warehouse
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Safety Buffer Health, Onboarding Hardware Demand & Straight-Line Asset Depreciation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <button
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Boxes className="w-4 h-4 text-indigo-400" />
            <span>Master Catalog</span>
          </button>
          <button
            onClick={() => setShowInwardModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Inward Assets (GRN)</span>
          </button>
          <button
            onClick={() => setShowScannerModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            title="Scan Physical Asset Barcode with Camera"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Barcode</span>
          </button>
          <button
            onClick={fetchInventoryData}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fleet Utilization */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fleet Deployment</span>
            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-300 rounded font-semibold border border-emerald-500/20">
              {metrics.utilizationRate}% In-Use
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-100">{metrics.totalAssets}</span>
            <span className="text-xs text-slate-400">Total Tracked Units</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-indigo-500 h-full transition-all"
                style={{ width: `${metrics.totalAssets > 0 ? (metrics.assignedCount / metrics.totalAssets) * 100 : 0}%` }}
                title={`Assigned: ${metrics.assignedCount}`}
              />
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${metrics.totalAssets > 0 ? (metrics.inStockCount / metrics.totalAssets) * 100 : 0}%` }}
                title={`In Stock: ${metrics.inStockCount}`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${metrics.totalAssets > 0 ? (metrics.inRepairCount / metrics.totalAssets) * 100 : 0}%` }}
                title={`In Repair: ${metrics.inRepairCount}`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Assigned ({metrics.assignedCount})</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>In Stock ({metrics.inStockCount})</span>
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Joiner Demand Radar */}
        <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden ${
          metrics.joinerDemand.shortfall > 0
            ? 'bg-rose-950/20 border-rose-800/40'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Onboarding Demand</span>
            <span className={`px-2 py-0.5 text-[10px] rounded font-semibold border ${
              metrics.joinerDemand.shortfall > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {metrics.joinerDemand.shortfall > 0 ? 'Deficit Warning' : 'Demand Covered'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-100">{metrics.joinerDemand.upcomingJoinersCount}</span>
            <span className="text-xs text-slate-400">Joiners Needing Devices</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">Laptops in Stock: <span className="text-slate-200 font-bold">{metrics.joinerDemand.laptopsInStock}</span></span>
            {metrics.joinerDemand.shortfall > 0 ? (
              <span className="text-rose-400 font-bold">Shortfall: -{metrics.joinerDemand.shortfall} units</span>
            ) : (
              <span className="text-emerald-400 font-medium">Surplus Buffer: +{metrics.joinerDemand.laptopsInStock - metrics.joinerDemand.upcomingJoinersCount}</span>
            )}
          </div>
        </div>

        {/* KPI 3: CapEx & Net Book Value */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fleet Valuation (NBV)</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-100">
              ₹{(metrics.financials.netBookValue / 100000).toFixed(2)}L
            </span>
            <span className="text-xs text-slate-400">Net Book Value</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Original CapEx: ₹{(metrics.financials.totalCapEx / 100000).toFixed(2)}L</span>
            <span className="text-amber-400">Depr: ₹{(metrics.financials.totalDepreciated / 100000).toFixed(2)}L</span>
          </div>
        </div>

        {/* KPI 4: Warranty Radar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Warranty Lifecycle</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-100">{metrics.warrantyStatus.activeCount}</span>
            <span className="text-xs text-emerald-400 font-semibold">Active OEM Coverage</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="text-amber-400">Expiring 90d: {metrics.warrantyStatus.expiring90DaysCount}</span>
            <span className="text-rose-400">Expired: {metrics.warrantyStatus.expiredCount}</span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any critical shortages exist */}
      {metrics.lowStockAlerts.length > 0 && (
        <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-xl flex items-start space-x-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold text-rose-200">
              Critical Warehouse Buffer Alerts Detected ({metrics.lowStockAlerts.length} Categories Below Safe Minimum)
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {metrics.lowStockAlerts.map((a: any, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-rose-900/40 text-rose-200 rounded border border-rose-700/50 text-[11px] font-semibold flex items-center space-x-1"
                >
                  <span>{a.category}:</span>
                  <span className="text-rose-400 font-bold">{a.inStock} in stock</span>
                  <span className="text-slate-400">(Min: {a.minBuffer})</span>
                  <span className="text-rose-300">→ Shortage: {a.shortage} units</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="border-b border-slate-800 flex items-center space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('buffers')}
          className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'buffers'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Buffer Radar & Visual Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'stock'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Category & Model Stock Report ({stockReport.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('depreciation')}
          className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'depreciation'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Financial Depreciation Ledger ({depreciationLedger.length})</span>
        </button>
      </div>

      {/* TAB 1: Buffer & Stock Health Radar (Enhanced with Recharts) */}
      {activeTab === 'buffers' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Interactive Recharts Visual Analytics Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 1: Safety Stock Buffer Radar (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    Category Safety Stock Radar (In-Stock vs Minimum Buffer)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Multi-Category Safety Buffer
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="inStock" name="In-Stock Ready" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="minBuffer" name="Minimum Buffer Target" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Fleet Status Allocation Donut (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <PieIcon className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      Fleet Deployment Distribution
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {metrics.totalAssets} Total Units
                  </span>
                </div>

                <div className="h-52 w-full pt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-stock-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any) => [`${val} units`, 'Count']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-[11px] flex items-center justify-between text-slate-400">
                <span>In-Store Readiness: <strong>{metrics.inStockCount} Units</strong></span>
                <span className="text-emerald-400 font-bold">{metrics.utilizationRate}% In-Use</span>
              </div>
            </div>
          </div>

          {/* Category Buffer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.categoryBuffers.map((b: any) => {
              const bufferPercent = Math.min(100, Math.round((b.inStock / (b.minBuffer || 1)) * 100));
              return (
                <div
                  key={b.category}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-200">{b.category}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        b.bufferHealth === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : b.bufferHealth === 'LOW'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : b.bufferHealth === 'SURPLUS'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {b.bufferHealth.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400">Total Fleet</span>
                      <p className="text-sm font-bold text-slate-200">{b.total}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400">In Stock</span>
                      <p className="text-sm font-bold text-emerald-400">{b.inStock}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Assigned</span>
                      <p className="text-sm font-bold text-slate-200">{b.assigned}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Safety Buffer Target: {b.minBuffer} units</span>
                      <span>{bufferPercent}% Coverage</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          b.bufferHealth === 'CRITICAL'
                            ? 'bg-rose-500'
                            : b.bufferHealth === 'LOW'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${bufferPercent}%` }}
                      />
                    </div>
                  </div>

                  {b.reorderNeeded > 0 ? (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300 flex items-center justify-between">
                      <span>Recommended Procurement:</span>
                      <span className="font-bold text-amber-400">+{b.reorderNeeded} Units</span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>Stock Status:</span>
                      <span className="font-medium">Adequate Safety Buffer</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Category & Model Stock Report */}
      {activeTab === 'stock' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Catalog Variant Breakdown ({stockReport.length})</span>
            <span className="text-xs text-slate-400">Tracked by Hardware Specifications</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Brand & Model</th>
                  <th className="px-5 py-3 text-center">In Stock</th>
                  <th className="px-5 py-3 text-center">Assigned</th>
                  <th className="px-5 py-3 text-center">In Repair</th>
                  <th className="px-5 py-3 text-center font-bold text-slate-200">Total Count</th>
                  <th className="px-5 py-3 text-right">Avg Unit Cost</th>
                  <th className="px-5 py-3 text-right font-bold text-emerald-400">Total Inventory CapEx</th>
                  <th className="px-5 py-3 text-center">Reorder Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stockReport.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3 font-sans font-semibold text-slate-200">
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-indigo-300 border border-slate-700">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-sans text-slate-300 font-medium">
                      {row.brand} - {row.model}
                    </td>
                    <td className="px-5 py-3 text-center text-emerald-400 font-bold">{row.inStock}</td>
                    <td className="px-5 py-3 text-center text-slate-300">{row.assigned}</td>
                    <td className="px-5 py-3 text-center text-amber-400">{row.inRepair}</td>
                    <td className="px-5 py-3 text-center font-bold text-slate-100">{row.total}</td>
                    <td className="px-5 py-3 text-right text-slate-400">₹{row.avgCost?.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-400">
                      ₹{row.totalCost?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-center font-sans">
                      {row.reorderRecommended ? (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-semibold text-[10px]">
                          Reorder Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-semibold text-[10px]">
                          Optimal Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Financial Depreciation Schedule Table (Enhanced with Recharts Curve) */}
      {activeTab === 'depreciation' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Recharts Depreciation Curve Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100">
                  Fleet Financial Trajectory (36-Month Straight-Line Schedule)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                CapEx: ₹{(metrics.financials.totalCapEx / 100000).toFixed(2)}L • NBV: ₹{(metrics.financials.netBookValue / 100000).toFixed(2)}L
              </span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={depreciationTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorItamNbv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area type="monotone" dataKey="capEx" name="Procurement CapEx Baseline" stroke="#64748b" strokeDasharray="4 4" fillOpacity={0} />
                  <Area type="monotone" dataKey="netBookValue" name="Current Net Book Value (NBV)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorItamNbv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search tag, model, custodian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="text-xs text-slate-400">
                Straight-Line Method: <span className="font-semibold text-slate-200">36 Months (33.3% / yr)</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Asset Tag</th>
                    <th className="px-4 py-3">Hardware & Serial</th>
                    <th className="px-4 py-3">Purchase Date</th>
                    <th className="px-4 py-3 text-right">Original Cost</th>
                    <th className="px-4 py-3 text-center">Age (Mo)</th>
                    <th className="px-4 py-3 text-right">Accumulated Depr.</th>
                    <th className="px-4 py-3 text-right">Net Book Value (NBV)</th>
                    <th className="px-4 py-3 text-center">Depr %</th>
                    <th className="px-4 py-3">Current Custodian</th>
                    <th className="px-4 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredDepreciation.map((d: any) => (
                    <tr key={d.assetId} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold text-indigo-400">{d.assetTag}</td>
                      <td className="px-4 py-3 font-sans">
                        <div className="font-semibold text-slate-200">{d.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {d.brand} {d.model} • S/N: {d.serialNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-sans">{d.purchaseDate}</td>
                      <td className="px-4 py-3 text-right text-slate-300 font-semibold">
                        ₹{d.purchaseCost.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">{d.ageInMonths}m</td>
                      <td className="px-4 py-3 text-right text-amber-400">
                        ₹{d.accumulatedDepreciation.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">
                        ₹{d.netBookValue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.depreciationPercent >= 80
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : d.depreciationPercent >= 50
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {d.depreciationPercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-300">{d.custodian}</td>
                      <td className="px-4 py-3 font-sans text-slate-400">{d.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Master Catalog Modal */}
      {showCatalogModal && (
        <MasterCatalogModal
          isOpen={showCatalogModal}
          onClose={() => {
            setShowCatalogModal(false);
            fetchInventoryData();
          }}
        />
      )}

      {/* Batch Inwarding Modal */}
      {showInwardModal && (
        <AssetInwardingModal
          isOpen={showInwardModal}
          onClose={() => {
            setShowInwardModal(false);
            fetchInventoryData();
          }}
          onInwardSuccess={() => {
            setShowInwardModal(false);
            fetchInventoryData();
          }}
        />
      )}

      {/* Barcode & QR Scanner Modal */}
      {showScannerModal && (
        <BarcodeScannerModal
          isOpen={showScannerModal}
          onClose={() => {
            setShowScannerModal(false);
            fetchInventoryData();
          }}
        />
      )}
    </div>
  );
};
