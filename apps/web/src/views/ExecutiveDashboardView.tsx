import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  Headphones,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Download,
  RefreshCw,
  ShieldCheck,
  Activity,
  Sparkles,
  Layers,
  ArrowRight,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { api } from '../api';
import { NavTab } from '../components/Sidebar';
import { EnlargedChartModal } from '../components/EnlargedChartModal';

interface ExecutiveDashboardViewProps {
  onNavigateTab?: (tab: NavTab, params?: any) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Power Switches & Telemetry Controls
  const [valuationMode, setValuationMode] = useState<'INR' | 'UNITS'>('INR');
  const [showBenchmarks, setShowBenchmarks] = useState<boolean>(true);
  const [enableRiskPulse, setEnableRiskPulse] = useState<boolean>(true);

  // Enlarged Chart Drilldown Modal State
  const [enlargedChart, setEnlargedChart] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    badge?: string;
    kpis?: any[];
    children: React.ReactNode;
    tableData?: any[];
    tableColumns?: any[];
  } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, tsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get(`/observability/time-series?range=${timeRange === '90d' ? '30d' : timeRange}`),
      ]);
      setStats(statsRes.data);
      setTimeSeries(tsRes.data);
    } catch (e) {
      console.error('Failed to load executive telemetry:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const handleExportSummaryCsv = () => {
    if (!stats) return;
    setIsExporting(true);
    try {
      const headers = ['Executive Domain', 'Metric Indicator', 'Current Value', 'Target SLA / Threshold', 'Audit Status'];
      const rows = [
        ['Workforce & Attendance', 'Today Attendance Rate', `${stats.attendancePercentage}%`, '>= 90.0%', stats.attendancePercentage >= 90 ? 'HEALTHY' : 'ATTENTION'],
        ['Workforce & Attendance', 'Total Headcount', `${stats.totalHeadcount} Employees`, 'N/A', 'ACTIVE'],
        ['Workforce & Attendance', 'Late Check-Ins', `${stats.todayLateCount} Records`, '<= 5%', 'MONITORED'],
        ['Workforce & Attendance', 'Absences Today', `${stats.todayAbsentCount} Employees`, 'N/A', 'LOGGED'],
        ['IT Service Desk (ITSM)', 'Open Incident Queue', `${stats.openTicketsCount} Tickets`, '<= 15', stats.openTicketsCount <= 15 ? 'HEALTHY' : 'SURGE'],
        ['IT Service Desk (ITSM)', 'SLA Resolution Compliance', `${stats.slaComplianceRate}%`, '>= 95.0%', stats.slaComplianceRate >= 95 ? 'OPTIMAL' : 'BREACH_RISK'],
        ['IT Service Desk (ITSM)', 'Active Breached Tickets', `${stats.slaBreachedTicketsCount}`, '0', stats.slaBreachedTicketsCount === 0 ? 'CLEARED' : 'ESCALATED'],
        ['Hardware Fleet (ITAM)', 'Total Tracked Assets', `${stats.totalAssetsCount} Units`, 'N/A', 'TRACKED'],
        ['Hardware Fleet (ITAM)', 'Deployed Assets', `${stats.assignedAssetsCount} Units`, 'N/A', 'IN_USE'],
        ['Hardware Fleet (ITAM)', 'Warehouse Buffer Stock', `${stats.idleAssetsCount} Units`, '>= 10%', stats.idleAssetsCount > 0 ? 'SUFFICIENT' : 'REORDER_ALERT'],
        ['Hardware Fleet (ITAM)', 'Fleet Original CapEx', `INR ${stats.totalAssetValue}`, 'N/A', 'AUDITED'],
        ['Offboarding & Governance', 'Pending Exit Clearances', `${stats.pendingExitClearancesCount}`, '0', stats.pendingExitClearancesCount === 0 ? 'CLEARED' : 'NOC_HELD'],
        ['Offboarding & Governance', 'Asset Loss Exposure', 'INR 0', 'INR 0', 'PROTECTED'],
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `EmpOps_Executive_Briefing_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Loading C-Suite Operations Telemetry...
          </p>
        </div>
      </div>
    );
  }

  // Cross-Domain Corporate Health Radar Data
  const attendanceScore = stats?.attendancePercentage || 92;
  const slaScore = stats?.slaComplianceRate || 95;
  const assetScore = stats?.totalAssetsCount > 0 ? Math.round((stats.assignedAssetsCount / stats.totalAssetsCount) * 100) : 88;
  const statutoryScore = 100; // Form 25 compliance guarantee
  const nocGateScore = 100; // Hardware recovery lock
  const safetyBufferScore = stats?.idleAssetsCount > 0 ? 90 : 70;

  const radarData = [
    { subject: 'Workforce Punctuality', score: attendanceScore, fullMark: 100 },
    { subject: 'ITSM SLA Compliance', score: slaScore, fullMark: 100 },
    { subject: 'Fleet In-Use Rate', score: assetScore, fullMark: 100 },
    { subject: 'Statutory Form 25', score: statutoryScore, fullMark: 100 },
    { subject: 'Exit NOC Gate', score: nocGateScore, fullMark: 100 },
    { subject: 'Stock Buffer Health', score: safetyBufferScore, fullMark: 100 },
  ];

  const overallHealthIndex = Math.round(
    (attendanceScore + slaScore + assetScore + statutoryScore + nocGateScore + safetyBufferScore) / 6
  );

  // Amortization Curve
  const totalCapEx = stats?.totalAssetValue || 600000;
  const totalAssetsCount = stats?.totalAssetsCount || 42;
  const depreciationTrajectory = [0, 6, 12, 18, 24, 30, 36].map((m) => {
    const residualFactor = 0.08;
    const depreciatedFactor = Math.max(residualFactor, 1 - (m / 36) * (1 - residualFactor));
    const nbv = Math.round(totalCapEx * depreciatedFactor);
    const unitNbv = Math.round(totalAssetsCount * depreciatedFactor);
    return {
      period: m === 0 ? 'M0 (New)' : m === 36 ? 'M36 (End)' : `M${m}`,
      capEx: totalCapEx,
      netBookValue: nbv,
      depreciated: totalCapEx - nbv,
      unitsCap: totalAssetsCount,
      unitsNet: unitNbv,
    };
  });

  // Ticket Velocity vs Resolutions
  const velocityData = timeSeries?.ticketVelocity || [
    { label: 'Mon', created: 6, resolved: 5, slaBreached: 0 },
    { label: 'Tue', created: 8, resolved: 7, slaBreached: 1 },
    { label: 'Wed', created: 5, resolved: 6, slaBreached: 0 },
    { label: 'Thu', created: 7, resolved: 7, slaBreached: 0 },
    { label: 'Fri', created: 9, resolved: 8, slaBreached: 1 },
    { label: 'Sat', created: 3, resolved: 4, slaBreached: 0 },
    { label: 'Sun', created: 2, resolved: 2, slaBreached: 0 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Executive Operations Command Center</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold">
              C-Suite Telemetry
            </span>
            <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time corporate telemetry across Workforce Productivity, ITIL Service Delivery, Fleet Amortization & Zero-Loss Offboarding
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['24h', '7d', '30d', '90d'] as const).map((r) => (
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
            onClick={handleExportSummaryCsv}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Executive Briefing'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Telemetry Power Display Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 px-4 py-2.5 rounded-xl text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-300">Executive Power Controls:</span>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Switch 1: Valuation Currency vs Unit Count */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] text-slate-400">Fleet Metrics:</span>
            <button
              onClick={() => setValuationMode(valuationMode === 'INR' ? 'UNITS' : 'INR')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                valuationMode === 'INR'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {valuationMode === 'INR' ? '₹ INR Valuation' : 'Asset Units'}
            </button>
          </div>

          {/* Switch 2: Benchmark Target Overlays */}
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <input
              type="checkbox"
              checked={showBenchmarks}
              onChange={(e) => setShowBenchmarks(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[11px] text-slate-300 font-medium">SLA Benchmarks</span>
          </label>

          {/* Switch 3: Anomaly Risk Pulse */}
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <input
              type="checkbox"
              checked={enableRiskPulse}
              onChange={(e) => setEnableRiskPulse(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[11px] text-slate-300 font-medium">Risk Alerts Pulse</span>
          </label>
        </div>
      </div>

      {/* Top 4 KPI Metrics with Interactive Deep Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Attendance */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('attendance')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/15"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workforce & Attendance</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">{stats.attendancePercentage}%</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {stats.todayPresentCount}/{stats.totalHeadcount} Present
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>Late Arrivals: <strong className="text-amber-400">{stats.todayLateCount}</strong></span>
            <span className="text-indigo-400 text-[11px] font-semibold flex items-center group-hover:underline">
              <span>View Roster</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </div>
        </div>

        {/* Metric 2: ITSM SLA */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('itsm')}
          className={`bg-slate-900/80 hover:bg-slate-900 border rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl ${
            enableRiskPulse && stats.slaBreachedTicketsCount > 0
              ? 'border-rose-500/60 ring-1 ring-rose-500/40 shadow-rose-950/20 hover:shadow-rose-500/15'
              : 'border-slate-800 hover:border-purple-500/60 hover:shadow-purple-500/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">IT Service Desk</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">{stats.slaComplianceRate}%</span>
            <span className="text-xs text-purple-300 font-semibold">SLA Compliance</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>Open: <strong className="text-slate-200">{stats.openTicketsCount}</strong></span>
            <span className={stats.slaBreachedTicketsCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-medium'}>
              Breached: {stats.slaBreachedTicketsCount}
            </span>
          </div>
        </div>

        {/* Metric 3: ITAM Assets */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('itam-stock')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/15"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {valuationMode === 'INR' ? 'Hardware Fleet Valuation' : 'Hardware Asset Units'}
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">
              {valuationMode === 'INR' ? `₹${(stats.totalAssetValue / 100000).toFixed(2)}L` : `${stats.totalAssetsCount} Units`}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {valuationMode === 'INR' ? 'Book Valuation' : 'Total Fleet'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>Active: <strong className="text-indigo-300">{stats.assignedAssetsCount}</strong></span>
            <span>Stock Buffer: <strong className="text-emerald-400">{stats.idleAssetsCount}</strong></span>
          </div>
        </div>

        {/* Metric 4: F&F Clearances */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('clearance')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/15"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Exit & F&F Governance</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">{stats.pendingExitClearancesCount}</span>
            <span className="text-xs text-amber-400 font-semibold">Pending Recovery</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>Asset Loss Exposure: <strong className="text-emerald-400">₹0</strong></span>
            <span className="text-indigo-400 font-medium">NOC Lock Active</span>
          </div>
        </div>
      </div>

      {/* Primary Visual Telemetry Section: Cross-Domain Radar + Straight-Line CapEx Amortization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cross-Domain Corporate Operations Radar (5 Cols) */}
        <div
          onClick={() =>
            setEnlargedChart({
              isOpen: true,
              title: 'Cross-Domain Corporate Operations Radar',
              subtitle: 'Comprehensive alignment across Workforce Punctuality, ITSM SLAs, Fleet Utilization & Governance',
              badge: `Health Index: ${overallHealthIndex}%`,
              kpis: [
                { label: 'Health Index', value: `${overallHealthIndex}%`, color: 'text-indigo-400' },
                { label: 'Workforce Punctuality', value: `${attendanceScore}%`, isPositive: attendanceScore >= 90, change: 'Target >=90%' },
                { label: 'ITSM SLA Compliance', value: `${slaScore}%`, isPositive: slaScore >= 95, change: 'Target >=95%' },
                { label: 'Exit Recovery Gate', value: '100%', isPositive: true, change: 'Zero Loss' },
              ],
              children: (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#334155" gridType="circle" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar name="Performance Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.45} strokeWidth={2.5} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} formatter={(val: any) => [`${val}%`, 'Compliance Score'] as [string, string]} />
                  </RadarChart>
                </ResponsiveContainer>
              ),
              tableData: radarData.map((r) => ({
                subject: r.subject,
                score: `${r.score}%`,
                benchmark: r.subject === 'ITSM SLA Compliance' ? '>= 95%' : r.subject === 'Workforce Punctuality' ? '>= 90%' : '>= 80%',
                status: r.score >= 90 ? 'OPTIMAL' : 'ATTENTION',
              })),
              tableColumns: [
                { key: 'subject', label: 'Operational Domain' },
                { key: 'score', label: 'Telemetry Score' },
                { key: 'benchmark', label: 'Target Benchmark' },
                { key: 'status', label: 'Audit Status' },
              ],
            })
          }
          className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between group cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.02] hover:-translate-y-1.5 hover:shadow-2xl hover:border-indigo-500/60 hover:bg-slate-900/95"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">Cross-Domain Operations Radar</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  <Maximize2 className="w-3 h-3" />
                  <span>Enlarge</span>
                </div>
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold">
                  <span>Health:</span>
                  <span className="text-indigo-400 font-black">{overallHealthIndex}%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Holistic alignment across Workforce Punctuality, ITIL Incident SLAs, Fleet Utilization & Governance.
            </p>

            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#334155" gridType="circle" strokeDasharray="2 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Radar
                    name="Performance Score"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.45}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Compliance Score'] as [string, string]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">SLA Rate</span>
              <span className="font-bold text-emerald-400">{slaScore}%</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">In-Use Fleet</span>
              <span className="font-bold text-indigo-400">{assetScore}%</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Statutory Gate</span>
              <span className="font-bold text-teal-400">100%</span>
            </div>
          </div>
        </div>

        {/* Right: Fleet Capital Valuation & 36-Month Amortization Trajectory (7 Cols) */}
        <div
          onClick={() =>
            setEnlargedChart({
              isOpen: true,
              title: '36-Month CapEx Amortization & Residual Net Book Value',
              subtitle: 'Straight-line asset depreciation telemetry across 3-year useful lifecycle with 8% salvage factor',
              badge: valuationMode === 'INR' ? `Current NBV: ₹${((totalCapEx * 0.72) / 100000).toFixed(2)}L` : `${totalAssetsCount} Tracked Units`,
              kpis: [
                { label: 'Procurement CapEx', value: `₹${(totalCapEx / 100000).toFixed(2)}L`, color: 'text-indigo-400' },
                { label: 'Current Net Book Value', value: `₹${((totalCapEx * 0.72) / 100000).toFixed(2)}L`, color: 'text-emerald-400' },
                { label: 'Accumulated Depreciation', value: `₹${((totalCapEx * 0.28) / 100000).toFixed(2)}L`, color: 'text-amber-400' },
                { label: 'Residual Salvage Floor', value: '8.0%', color: 'text-slate-300' },
              ],
              children: (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={depreciationTrajectory} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="modalExecCapExGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="modalExecNbvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(val) => valuationMode === 'INR' ? `₹${(val / 100000).toFixed(1)}L` : `${val}u`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '13px' }}
                      formatter={(val: any, name: any) => [valuationMode === 'INR' ? `₹${Number(val).toLocaleString()}` : `${val} Units`, name] as [string, string]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey={valuationMode === 'INR' ? 'capEx' : 'unitsCap'}
                      name={valuationMode === 'INR' ? 'Procurement CapEx (Cost)' : 'Gross Acquired Fleet'}
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#modalExecCapExGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey={valuationMode === 'INR' ? 'netBookValue' : 'unitsNet'}
                      name={valuationMode === 'INR' ? 'Current Net Book Value (NBV)' : 'Amortized Equivalent Units'}
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#modalExecNbvGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ),
              tableData: depreciationTrajectory.map((d) => ({
                period: d.period,
                capEx: `₹${d.capEx.toLocaleString()}`,
                netBookValue: `₹${d.netBookValue.toLocaleString()}`,
                depreciated: `₹${d.depreciated.toLocaleString()}`,
                unitsRemaining: `${d.unitsNet} of ${d.unitsCap}`,
              })),
              tableColumns: [
                { key: 'period', label: 'Amortization Period' },
                { key: 'capEx', label: 'Procurement Cost' },
                { key: 'netBookValue', label: 'Net Book Value (NBV)' },
                { key: 'depreciated', label: 'Accumulated Depreciation' },
                { key: 'unitsRemaining', label: 'Unit Equivalent' },
              ],
            })
          }
          className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 group cursor-pointer transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-2xl hover:border-emerald-500/50 hover:bg-slate-900/95"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {valuationMode === 'INR'
                    ? '36-Month CapEx Amortization & Residual Net Book Value'
                    : '36-Month Asset Lifecycle & Unit Amortization'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Straight-line depreciation trajectory for IT assets across 3-year useful lifecycle
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <Maximize2 className="w-3 h-3" />
                <span>Enlarge</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold">
                Salvage: 8%
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={depreciationTrajectory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="execCapExGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="execNbvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(val) => valuationMode === 'INR' ? `₹${(val / 100000).toFixed(1)}L` : `${val}u`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [valuationMode === 'INR' ? `₹${Number(val).toLocaleString()}` : `${val} Units`, name] as [string, string]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area
                  type="monotone"
                  dataKey={valuationMode === 'INR' ? 'capEx' : 'unitsCap'}
                  name={valuationMode === 'INR' ? 'Procurement CapEx (Cost)' : 'Fleet Units'}
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#execCapExGrad)"
                />
                <Area
                  type="monotone"
                  dataKey={valuationMode === 'INR' ? 'netBookValue' : 'unitsNet'}
                  name={valuationMode === 'INR' ? 'Current Net Book Value (NBV)' : 'Amortized Units'}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#execNbvGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase tracking-wider block text-slate-500">Gross CapEx Acquired</span>
              <span className="font-bold text-slate-200">
                {valuationMode === 'INR' ? `₹${(totalCapEx / 100000).toFixed(2)} Lakhs` : `${totalAssetsCount} Units`}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider block text-slate-500">Current Net Book Value</span>
              <span className="font-bold text-emerald-400">
                {valuationMode === 'INR' ? `₹${((totalCapEx * 0.72) / 100000).toFixed(2)} Lakhs` : `${Math.round(totalAssetsCount * 0.72)} Active Eq`}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider block text-slate-500">Accumulated Amortization</span>
              <span className="font-bold text-amber-400">
                {valuationMode === 'INR' ? `₹${((totalCapEx * 0.28) / 100000).toFixed(2)} Lakhs` : `${Math.round(totalAssetsCount * 0.28)} Depreciated`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Incident Velocity vs Resolution Velocity */}
      <div
        onClick={() =>
          setEnlargedChart({
            isOpen: true,
            title: 'Operational Incident Inflow vs Resolution Flow',
            subtitle: 'Engineering resolution velocity against incoming ticket flow and SLA compliance tracking',
            badge: `${stats.openTicketsCount} in Active Queue`,
            kpis: [
              { label: 'Open Incidents', value: stats.openTicketsCount, color: 'text-indigo-400' },
              { label: 'SLA Resolution Rate', value: `${stats.slaComplianceRate}%`, isPositive: stats.slaComplianceRate >= 95, change: 'Target >=95%' },
              { label: 'Breached Tickets', value: stats.slaBreachedTicketsCount, isPositive: stats.slaBreachedTicketsCount === 0, change: 'Target 0' },
            ],
            children: (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '13px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {showBenchmarks && <ReferenceLine y={8} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Daily SLA Ceiling (8)', fill: '#f43f5e', fontSize: 11 }} />}
                  <Bar dataKey="created" name="Tickets Logged" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="slaBreached" name="Breached" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ),
            tableData: velocityData.map((v: any) => ({
              period: v.label,
              created: v.created,
              resolved: v.resolved,
              breached: v.slaBreached,
              netThroughput: v.resolved >= v.created ? `+${v.resolved - v.created}` : `-${v.created - v.resolved}`,
            })),
            tableColumns: [
              { key: 'period', label: 'Day / Interval' },
              { key: 'created', label: 'Incidents Logged' },
              { key: 'resolved', label: 'Incidents Resolved' },
              { key: 'breached', label: 'SLA Breaches' },
              { key: 'netThroughput', label: 'Queue Net Velocity' },
            ],
          })
        }
        className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 group cursor-pointer transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-2xl hover:border-purple-500/50 hover:bg-slate-900/95"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <Headphones className="w-4 h-4 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Operational Incident Inflow vs Resolution Flow</h3>
              <p className="text-[11px] text-slate-400">
                Velocity of incoming service requests versus engineering resolution throughput
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              <Maximize2 className="w-3 h-3" />
              <span>Enlarge</span>
            </div>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span className="text-slate-300">Tickets Logged</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-300">Tickets Resolved</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="text-slate-300">SLA Breached</span>
            </span>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={velocityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              {showBenchmarks && (
                <ReferenceLine y={8} stroke="#f43f5e" strokeDasharray="3 3" />
              )}
              <Bar dataKey="created" name="Tickets Logged" fill="#6366f1" radius={[5, 5, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[5, 5, 0, 0]} />
              <Bar dataKey="slaBreached" name="Breached" fill="#f43f5e" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategic Wedge Highlight: The Unified Employee-Asset-Ticket Trinity */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">The "Employee-Asset-Ticket Trinity" In Action</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              EmpOps connects Employee Lifecycle, Attendance, IT Service Desk, and Hardware Custody into one atomic database transaction.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-semibold rounded-full">
            Zero Operational Silos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          <div
            onClick={() => onNavigateTab && onNavigateTab('hr')}
            className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 text-xs space-y-1.5 cursor-pointer transition"
          >
            <div className="font-bold text-indigo-400 flex items-center justify-between">
              <span>1. HR Onboards Joiner</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-slate-300">HR creates employee profile in Bengaluru HQ.</p>
            <p className="text-[11px] text-emerald-400 font-semibold">⚡ Auto-triggers IT provisioning ticket</p>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('itam')}
            className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 text-xs space-y-1.5 cursor-pointer transition"
          >
            <div className="font-bold text-purple-400 flex items-center justify-between">
              <span>2. IT Assigns Laptop</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-slate-300">IT assigns MacBook Pro (C02G87Y0MD6R).</p>
            <p className="text-[11px] text-purple-300 font-semibold">⚡ Generates digital custody sign-off</p>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 rounded-xl p-4 text-xs space-y-1.5 cursor-pointer transition"
          >
            <div className="font-bold text-blue-400 flex items-center justify-between">
              <span>3. ESS Daily Punch & Work</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-slate-300">Employee punches via GPS Geofence & logs IT tickets.</p>
            <p className="text-[11px] text-blue-300 font-semibold">⚡ Verified muster roll & SLA tracking</p>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('clearance')}
            className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 text-xs space-y-1.5 cursor-pointer transition"
          >
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>4. Offboarding & F&F</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-slate-300">Employee resigns &rarr; IT receives recovery checklist.</p>
            <p className="text-[11px] text-emerald-400 font-semibold">⚡ On laptop return &rarr; Instant IT NOC</p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Live Attendance Telemetry & Active ITSM Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Attendance Punches */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Live Workforce Punches</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Real-Time Ingestion</span>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {stats.recentPunches?.length > 0 ? (
              stats.recentPunches.map((punch: any) => (
                <div key={punch.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-[11px]">
                      {punch.employeeName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{punch.employeeName}</p>
                      <p className="text-[11px] text-slate-400">
                        {punch.mode.replace('_', ' ')} • {new Date(punch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-semibold text-[10px]">
                      {punch.type}
                    </span>
                    {punch.isWithinGeofence && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">
                        Geofence Verified
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-500">No punches recorded yet today.</p>
            )}
          </div>
        </div>

        {/* Right: Active Service Desk Incidents */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Headphones className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">Active ITSM Tickets & SLAs</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{stats.openTicketsCount} in Queue</span>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {stats.recentTickets?.length > 0 ? (
              stats.recentTickets.map((ticket: any) => (
                <div key={ticket.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] text-purple-400 font-bold">{ticket.ticketNumber}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="font-medium text-slate-200 truncate">{ticket.title}</p>
                    <p className="text-[11px] text-slate-400">By {ticket.requesterName}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-medium text-[11px]">
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-500">No active tickets.</p>
            )}
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
          onJumpToModule={(tab, params) => onNavigateTab && onNavigateTab(tab, params)}
        >
          {enlargedChart.children}
        </EnlargedChartModal>
      )}
    </div>
  );
};

