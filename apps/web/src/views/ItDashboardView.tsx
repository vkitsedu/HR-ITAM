import React, { useEffect, useState } from 'react';
import {
  Laptop,
  Headphones,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Boxes,
  QrCode,
  Sparkles,
  RefreshCw,
  Plus,
  Download,
  Activity,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  Maximize2,
  Sliders,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { api } from '../api';
import { NavTab } from '../components/Sidebar';
import { EnlargedChartModal } from '../components/EnlargedChartModal';
import { FleetStatusDonut } from '../components/FleetStatusDonut';

interface ItDashboardViewProps {
  onNavigateTab?: (tab: NavTab, params?: any) => void;
}

export const ItDashboardView: React.FC<ItDashboardViewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [pendingExits, setPendingExits] = useState<any[]>([]);
  const [timeSeries, setTimeSeries] = useState<any>(null);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [donutFilter, setDonutFilter] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Power Switches & Telemetry Controls
  const [showBufferThresholds, setShowBufferThresholds] = useState<boolean>(true);
  const [enableDeficitPulse, setEnableDeficitPulse] = useState<boolean>(true);

  // Enlarged Chart Drilldown Modal State
  const [enlargedChart, setEnlargedChart] = useState<{
    isOpen: boolean;
    chartId?: string;
    title: string;
    subtitle?: string;
    badge?: string;
    kpis?: any[];
    children: React.ReactNode;
    tableData?: any[];
    tableColumns?: any[];
    detailedAssets?: any[];
    activeFilterKey?: string;
    onFilterSelect?: (filterKey: string) => void;
    onJumpToModule?: (tab: NavTab, params?: any) => void;
    jumpLabel?: string;
    jumpTab?: NavTab;
  } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashRes, invRes, tktRes, exitRes, tsRes, assetRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/itam/inventory/metrics'),
        api.get('/itsm/tickets'),
        api.get('/itam/exit-clearances'),
        api.get(`/observability/time-series?range=${timeRange}`),
        api.get('/itam/assets'),
      ]);
      setStats(dashRes.data);
      setInventory(invRes.data);
      setRecentTickets(tktRes.data.slice(0, 5));
      setPendingExits(exitRes.data.filter((e: any) => !e.itNocIssued));
      setTimeSeries(tsRes.data);
      setAllAssets(assetRes.data || []);
    } catch (err) {
      console.error('Failed to load IT Dashboard telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const handleExportCsv = () => {
    if (!inventory) return;
    const headers = ['Category', 'Total Units', 'In Stock', 'Assigned', 'In Repair', 'Min Safety Buffer', 'Buffer Health', 'Reorder Required'];
    const rows = (inventory.categoryBuffers || []).map((b: any) => [
      b.category,
      b.total,
      b.inStock,
      b.assigned,
      b.inRepair,
      b.minBuffer,
      b.bufferHealth,
      b.reorderNeeded,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EmpOps_IT_Operations_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading && (!stats || !inventory)) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Connecting to IT Operations Telemetry...</p>
        </div>
      </div>
    );
  }

  // Visual Telemetry Chart Datasets
  const statusPieData = [
    { name: 'Assigned', value: inventory?.assignedCount || 0, color: '#6366f1' },
    { name: 'In Stock', value: inventory?.inStockCount || 0, color: '#10b981' },
    { name: 'In Repair', value: inventory?.inRepairCount || 0, color: '#f59e0b' },
    { name: 'Retired', value: inventory?.retiredCount || 0, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const categoryBarData = (inventory?.categoryBuffers || []).map((b: any) => ({
    category: b.category,
    inStock: b.inStock,
    minBuffer: b.minBuffer,
    assigned: b.assigned,
    total: b.total,
    health: b.bufferHealth,
    reorderNeeded: b.reorderNeeded,
  }));

  const ticketTrendData = timeSeries?.ticketVelocity || [
    { label: 'Mon', created: 4, resolved: 5, slaBreached: 0 },
    { label: 'Tue', created: 7, resolved: 6, slaBreached: 1 },
    { label: 'Wed', created: 5, resolved: 5, slaBreached: 0 },
    { label: 'Thu', created: 6, resolved: 7, slaBreached: 0 },
    { label: 'Fri', created: 8, resolved: 7, slaBreached: 1 },
    { label: 'Sat', created: 2, resolved: 3, slaBreached: 0 },
    { label: 'Sun', created: 1, resolved: 1, slaBreached: 0 },
  ];

  const openFleetDonutModal = (overrideFilter?: string) => {
    const activeF = overrideFilter || donutFilter;
    setEnlargedChart({
      isOpen: true,
      chartId: 'fleet-donut',
      title: 'Fleet Deployment Status Breakdown',
      subtitle: 'Proportional distribution of active, in-stock, under repair, and retired IT hardware',
      badge: `${inventory?.utilizationRate || 0}% Fleet Deployed`,
      kpis: [
        { label: 'Total Tracked Assets', value: inventory?.totalAssets || 0, color: 'text-slate-100', filterKey: 'ALL' },
        { label: 'Deployed to Employees', value: `${inventory?.assignedCount || 0} units`, color: 'text-indigo-400', filterKey: 'ASSIGNED' },
        { label: 'Buffer Stock Ready', value: `${inventory?.inStockCount || 0} units`, color: 'text-emerald-400', filterKey: 'IN_STOCK' },
        { label: 'Under Repair', value: `${inventory?.inRepairCount || 0} units`, color: 'text-amber-400', filterKey: 'IN_REPAIR' },
      ],
      children: (
        <div className="w-full h-full flex items-center justify-center p-2">
          <FleetStatusDonut
            assignedCount={inventory?.assignedCount || 0}
            inStockCount={inventory?.inStockCount || 0}
            inRepairCount={inventory?.inRepairCount || 0}
            retiredCount={inventory?.retiredCount || 0}
            totalAssets={inventory?.totalAssets || 0}
            utilizationRate={inventory?.utilizationRate || 0}
            isEnlarged={true}
            selectedStatus={activeF}
            onSliceClick={(fKey) => {
              setDonutFilter(fKey);
              openFleetDonutModal(fKey);
            }}
          />
        </div>
      ),
      detailedAssets: allAssets,
      activeFilterKey: activeF,
      onFilterSelect: (fKey) => {
        setDonutFilter(fKey);
        openFleetDonutModal(fKey);
      },
      onJumpToModule: (tab, params) => {
        if (onNavigateTab) {
          onNavigateTab(tab, params);
        }
      },
      jumpLabel: 'Jump to Fleet Inventory',
      jumpTab: 'itam',
    });
  };

  const openCategoryBarModal = () => {
    setEnlargedChart({
      isOpen: true,
      chartId: 'category-buffers',
      title: 'Category Stock Buffer vs Minimum Requirement',
      subtitle: 'Real-time stock on hand vs configured threshold per equipment category',
      badge: `${inventory?.inStockCount || 0} Total In-Stock`,
      kpis: [
        { label: 'Total Tracked Assets', value: inventory?.totalAssets || 0, color: 'text-slate-100', filterKey: 'ALL' },
        { label: 'Warehouse Stock', value: inventory?.inStockCount || 0, color: 'text-emerald-400', filterKey: 'IN_STOCK' },
        { label: 'Assigned to Staff', value: inventory?.assignedCount || 0, color: 'text-indigo-400', filterKey: 'ASSIGNED' },
        { label: 'In Repair', value: inventory?.inRepairCount || 0, color: 'text-amber-400', filterKey: 'IN_REPAIR' },
      ],
      children: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryBarData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '13px' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="inStock" name="In-Stock Units" fill="#10b981" radius={[6, 6, 0, 0]} />
            {showBufferThresholds && (
              <Bar dataKey="minBuffer" name="Min Safety Buffer" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            )}
            <Bar dataKey="assigned" name="Assigned to Staff" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
      detailedAssets: allAssets,
      tableData: categoryBarData.map((c: any) => ({
        category: c.category,
        inStock: c.inStock,
        minBuffer: c.minBuffer,
        assigned: c.assigned,
        total: c.total,
        health: c.health,
        reorderNeeded: c.reorderNeeded > 0 ? `+${c.reorderNeeded} Units` : 'Optimal',
      })),
      tableColumns: [
        { key: 'category', label: 'Hardware Category' },
        { key: 'inStock', label: 'In-Stock Units' },
        { key: 'minBuffer', label: 'Safety Buffer' },
        { key: 'assigned', label: 'Assigned Units' },
        { key: 'total', label: 'Fleet Total' },
        { key: 'health', label: 'Buffer Health' },
        { key: 'reorderNeeded', label: 'Reorder Advice' },
      ],
      onJumpToModule: (tab, params) => {
        if (onNavigateTab) {
          onNavigateTab(tab, params);
        }
      },
      jumpLabel: 'Jump to Stock Planning',
      jumpTab: 'itam-stock',
    });
  };

  const openItsmAreaModal = () => {
    setEnlargedChart({
      isOpen: true,
      chartId: 'itsm-sla',
      title: 'ITSM Incident Inflow & Resolution Velocity',
      subtitle: 'Tracking ticket lifecycle velocity against resolution commitments and business-hours SLAs',
      badge: `${stats?.slaComplianceRate || 0}% Resolution Compliance`,
      kpis: [
        { label: 'Open Incidents', value: stats?.openTicketsCount || 0, color: 'text-indigo-400' },
        { label: 'Resolution Rate', value: `${stats?.slaComplianceRate || 0}%`, isPositive: (stats?.slaComplianceRate || 0) >= 95, change: 'Target >=95%' },
        { label: 'Breached Tickets', value: stats?.slaBreachedTicketsCount || 0, isPositive: (stats?.slaBreachedTicketsCount || 0) === 0, change: 'Target 0' },
      ],
      children: (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ticketTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <defs>
              <linearGradient id="modalItTktInflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="modalItTktResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '13px' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Area
              type="monotone"
              dataKey="created"
              name="Tickets Logged"
              stroke="#a855f7"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#modalItTktInflowGrad)"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="Resolved"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#modalItTktResolvedGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
      tableData: ticketTrendData.map((t: any) => ({
        period: t.label,
        created: t.created,
        resolved: t.resolved,
        breached: t.slaBreached,
        netThroughput: t.resolved >= t.created ? `+${t.resolved - t.created}` : `-${t.created - t.resolved}`,
      })),
      tableColumns: [
        { key: 'period', label: 'Day' },
        { key: 'created', label: 'Logged Incidents' },
        { key: 'resolved', label: 'Resolved Tickets' },
        { key: 'breached', label: 'SLA Breaches' },
        { key: 'netThroughput', label: 'Net Queue Change' },
      ],
      onJumpToModule: (tab, params) => {
        if (onNavigateTab) {
          onNavigateTab(tab, params);
        }
      },
      jumpLabel: 'Jump to ITSM Service Desk',
      jumpTab: 'itsm',
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-100">IT Operations Command Center</h2>
            <span className="px-2.5 py-0.5 text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold">
              ITIL & ITAM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry across Hardware Fleet, Warehouse Buffer, SLA Compliance & Asset Recovery Gate
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Horizon Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded font-semibold transition ${
                  timeRange === r
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>

          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('itam')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Asset</span>
              </button>
              <button
                onClick={() => onNavigateTab('itsm')}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Service Desk</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Interactive Telemetry Power Display Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 px-4 py-2.5 rounded-xl text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-300">IT Operations Controls:</span>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Switch 1: Buffer Threshold Visibility */}
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <input
              type="checkbox"
              checked={showBufferThresholds}
              onChange={(e) => setShowBufferThresholds(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[11px] text-slate-300 font-medium">Safety Buffer Bars</span>
          </label>

          {/* Switch 2: Stock Deficit Warning Pulse */}
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <input
              type="checkbox"
              checked={enableDeficitPulse}
              onChange={(e) => setEnableDeficitPulse(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[11px] text-slate-300 font-medium">Stock Deficit Radar Pulse</span>
          </label>
        </div>
      </div>

      {/* 4 Critical IT Operations KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fleet Utilization & Buffer */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('itam-stock')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/15"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hardware Fleet</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">{inventory.totalAssets}</span>
            <span className="text-xs text-emerald-400 font-semibold">{inventory.utilizationRate}% Deployed</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>In-Stock: <strong className="text-emerald-400">{inventory.inStockCount}</strong></span>
            <span>In-Repair: <strong className="text-amber-400">{inventory.inRepairCount}</strong></span>
          </div>
        </div>

        {/* KPI 2: ITSM SLA Compliance */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('itsm')}
          className={`bg-slate-900/80 hover:bg-slate-900 border rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl ${
            enableDeficitPulse && stats.slaBreachedTicketsCount > 0
              ? 'border-rose-500/60 ring-1 ring-rose-500/40 hover:shadow-rose-500/15'
              : 'border-slate-800 hover:border-purple-500/60 hover:shadow-purple-500/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Incident SLAs</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">{stats.openTicketsCount}</span>
            <span className="text-xs text-slate-400">Open Incidents</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span className="text-emerald-400 font-medium">Compliance: {stats.slaComplianceRate}%</span>
            <span className={stats.slaBreachedTicketsCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              Breached: {stats.slaBreachedTicketsCount}
            </span>
          </div>
        </div>

        {/* KPI 3: Onboarding Hardware Demand */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('itam-stock')}
          className={`border rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl ${
            inventory.joinerDemand.shortfall > 0
              ? 'bg-rose-950/20 border-rose-800/40 ring-1 ring-rose-500/30 hover:shadow-rose-500/15'
              : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/60 hover:shadow-indigo-500/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">30-Day Joiner Demand</span>
            <span className={`px-2 py-0.5 text-[10px] rounded font-semibold border ${
              inventory.joinerDemand.shortfall > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {inventory.joinerDemand.shortfall > 0 ? 'Shortfall Alert' : 'Covered'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">
              {inventory.joinerDemand.upcomingJoinersCount}
            </span>
            <span className="text-xs text-slate-400">Devices Needed</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-slate-800/80">
            <span className="text-slate-400">Laptops in Stock: <strong className="text-slate-200">{inventory.joinerDemand.laptopsInStock}</strong></span>
            {inventory.joinerDemand.shortfall > 0 ? (
              <span className="text-rose-400 font-bold">Deficit: -{inventory.joinerDemand.shortfall}</span>
            ) : (
              <span className="text-emerald-400 font-medium">Safe Buffer</span>
            )}
          </div>
        </div>

        {/* KPI 4: Offboarding Recovery Gate */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('clearance')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/15"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Offboarding Asset Recovery</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">{pendingExits.length}</span>
            <span className="text-xs text-amber-400 font-semibold">Pending Return</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>IT NOC: <strong className="text-amber-400">Gated / Locked</strong></span>
            <span className="text-emerald-400 font-semibold">Zero Ghost Loss</span>
          </div>
        </div>
      </div>

      {/* Primary Visual Telemetry Section: Buffer Bar Chart + Status Donut + Incident SLA Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category Buffers vs Safety Stock (8 Cols) */}
        <div
          onClick={() =>
            enlargedChart?.isOpen && enlargedChart?.chartId === 'category-buffers'
              ? setEnlargedChart(null)
              : openCategoryBarModal()
          }
          className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.018] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/60 hover:bg-slate-900/95"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">Category Stock Buffer vs Minimum Requirement</h3>
                <p className="text-[11px] text-slate-400">
                  Real-time stock on hand vs configured threshold per equipment category
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                <Maximize2 className="w-3 h-3" />
                <span>Enlarge</span>
              </div>
              <span className="text-xs text-slate-400">Buffer Telemetry</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="inStock" name="In-Stock Units" fill="#10b981" radius={[5, 5, 0, 0]} />
                {showBufferThresholds && (
                  <Bar dataKey="minBuffer" name="Min Safety Buffer" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                )}
                <Bar dataKey="assigned" name="Assigned to Staff" fill="#6366f1" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Fleet Status Donut (4 Cols) */}
        <div
          onClick={() =>
            enlargedChart?.isOpen && enlargedChart?.chartId === 'fleet-donut'
              ? setEnlargedChart(null)
              : openFleetDonutModal()
          }
          className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/15 hover:border-emerald-500/60 hover:bg-slate-900/95"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Fleet Deployment Status</h3>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                  <Maximize2 className="w-3 h-3" />
                  <span>Zoom / Inspect</span>
                </div>
                <span className="text-xs text-emerald-400 font-bold">{inventory.utilizationRate}% In-Use</span>
              </div>
            </div>

            <div className="h-48 mt-2 relative">
              <FleetStatusDonut
                assignedCount={inventory.assignedCount}
                inStockCount={inventory.inStockCount}
                inRepairCount={inventory.inRepairCount}
                retiredCount={inventory.retiredCount}
                totalAssets={inventory.totalAssets}
                utilizationRate={inventory.utilizationRate}
                isEnlarged={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 truncate">{item.name}:</span>
                <span className="font-bold text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle: ITSM SLA Velocity Stream Area Chart */}
      <div
        onClick={() =>
          enlargedChart?.isOpen && enlargedChart?.chartId === 'itsm-sla'
            ? setEnlargedChart(null)
            : openItsmAreaModal()
        }
        className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.018] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/60 hover:bg-slate-900/95"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">ITSM Incident Inflow & Resolution Velocity</h3>
              <p className="text-[11px] text-slate-400">
                Tracking ticket lifecycle velocity against resolution commitments
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              <Maximize2 className="w-3 h-3" />
              <span>Enlarge</span>
            </div>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-300">New Tickets</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Resolved</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Breached</span>
            </span>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ticketTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="itTktInflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="itTktResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="created"
                name="Tickets Logged"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#itTktInflowGrad)"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#itTktResolvedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Column Command Grid: Active Incidents + Warehouse Buffer Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Live ITSM Incident Queue */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Headphones className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">Live Incident & SLA Monitor</h3>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('itsm')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <span>View All Tickets</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {recentTickets.map((t) => (
              <div
                key={t.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition"
              >
                <div className="space-y-1 max-w-[70%]">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-purple-400 font-bold">{t.ticketNumber}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                      {t.category}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      t.priority === 'CRITICAL' || t.priority === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-200 truncate">{t.title}</h4>
                  <p className="text-[11px] text-slate-400">Requester: {t.requesterName}</p>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'RESOLVED'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-indigo-500/15 text-indigo-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  {t.isSlaBreached ? (
                    <p className="text-[10px] text-rose-400 font-semibold flex items-center justify-end">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Breached
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                      On-track
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Warehouse Buffer & Safety Stock Radar */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Warehouse Safety Stock Levels</h3>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('itam-stock')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <span>Full Stock Report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {inventory.categoryBuffers.slice(0, 5).map((b: any) => {
              const bufferPercent = Math.min(100, Math.round((b.inStock / (b.minBuffer || 1)) * 100));
              return (
                <div key={b.category} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{b.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.bufferHealth === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : b.bufferHealth === 'LOW'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {b.inStock} In-Stock / Min: {b.minBuffer}
                    </span>
                  </div>

                  {/* Fill Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
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

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Total Fleet: {b.total} units ({b.assigned} assigned)</span>
                    {b.reorderNeeded > 0 ? (
                      <span className="text-amber-400 font-bold">Reorder: +{b.reorderNeeded} required</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Buffer Adequate</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enlarged Interactive Chart Modal */}
      {enlargedChart && (
        <EnlargedChartModal
          isOpen={enlargedChart.isOpen}
          onClose={() => setEnlargedChart(null)}
          title={enlargedChart.title}
          subtitle={enlargedChart.subtitle}
          badge={enlargedChart.badge}
          kpis={enlargedChart.kpis}
          tableData={enlargedChart.tableData}
          tableColumns={enlargedChart.tableColumns}
          detailedAssets={enlargedChart.detailedAssets}
          activeFilterKey={enlargedChart.activeFilterKey}
          onFilterSelect={enlargedChart.onFilterSelect}
          onJumpToModule={enlargedChart.onJumpToModule}
          jumpLabel={enlargedChart.jumpLabel}
          jumpTab={enlargedChart.jumpTab}
        >
          {enlargedChart.children}
        </EnlargedChartModal>
      )}
    </div>
  );
};

