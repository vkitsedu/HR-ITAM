import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Terminal,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Radio,
  Boxes,
  Headphones,
  TrendingDown,
  Cpu,
  ShieldAlert,
  Server,
  Maximize2,
  Minimize2,
  Sparkles,
  Clock,
  Download,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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

export const NocObservabilityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'prometheus' | 'external-grafana'>('studio');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [domainFilter, setDomainFilter] = useState<'all' | 'itam' | 'itsm' | 'hr'>('all');
  const [autoRefreshSecs, setAutoRefreshSecs] = useState<number>(15);
  const [countdown, setCountdown] = useState<number>(15);
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [promMetrics, setPromMetrics] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingProm, setIsLoadingProm] = useState<boolean>(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [externalGrafanaUrl, setExternalGrafanaUrl] = useState<string>('http://localhost:3001/d/empops-noc?kiosk=tv');

  const timerRef = useRef<any>(null);

  // Fetch telemetry time-series
  const fetchTelemetry = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const res = await api.get(`/observability/time-series?range=${timeRange}`);
      setTimeSeriesData(res.data);
    } catch (e) {
      console.error('Failed to load in-app telemetry:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setCountdown(autoRefreshSecs);
    }
  };

  // Fetch raw OpenMetrics
  const fetchPromMetrics = async () => {
    try {
      setIsLoadingProm(true);
      const res = await api.get('/metrics');
      setPromMetrics(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      setPromMetrics(`# Failed to fetch Prometheus metrics: ${e.message}`);
    } finally {
      setIsLoadingProm(false);
    }
  };

  // Initial load and on range change
  useEffect(() => {
    fetchTelemetry();
  }, [timeRange]);

  // Tab switch
  useEffect(() => {
    if (activeTab === 'prometheus') {
      fetchPromMetrics();
    }
  }, [activeTab]);

  // Live Auto-Refresh Countdown Engine
  useEffect(() => {
    if (autoRefreshSecs <= 0) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchTelemetry(true);
          return autoRefreshSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [autoRefreshSecs, timeRange]);

  // Keyboard shortcut for Kiosk mode (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isKioskMode) {
        setIsKioskMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKioskMode]);

  const handleCopyEndpoint = () => {
    const fullUrl = `${window.location.protocol}//${window.location.hostname}:4005/api/metrics`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleExportCsv = () => {
    if (!timeSeriesData) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Fleet Assets', timeSeriesData.kpiSummary.totalAssets],
      ['In-Stock Safety Buffer', timeSeriesData.kpiSummary.inStockCount],
      ['Fleet Utilization Rate', `${timeSeriesData.kpiSummary.utilizationRate}%`],
      ['30-Day Joiner Shortfall', timeSeriesData.kpiSummary.joinerShortfall],
      ['Active Open Incidents', timeSeriesData.kpiSummary.openTicketsCount],
      ['SLA Breaches', timeSeriesData.kpiSummary.slaBreachedCount],
      ['Original Procurement CapEx (INR)', timeSeriesData.kpiSummary.totalCapEx],
      ['Current Net Book Value (INR)', timeSeriesData.kpiSummary.netBookValue],
      ['Accumulated Depreciation (INR)', timeSeriesData.kpiSummary.accumulatedDepreciation],
      ['Node Memory RSS (MB)', timeSeriesData.systemTelemetry.memoryRssMb],
      ['System Uptime (Seconds)', timeSeriesData.systemTelemetry.uptimeSeconds],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `empops-telemetry-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast('Telemetry metrics CSV downloaded!');
    setTimeout(() => setExportToast(null), 3000);
  };

  if (isLoading || !timeSeriesData) {
    return (
      <div className="p-16 flex items-center justify-center min-h-[550px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm text-slate-200 font-bold tracking-wide">
              Loading In-App Native Telemetry Studio...
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Computing real-time time-series curves & safety buffer radar
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { kpiSummary, ticketVelocity, punchActivity, depreciationCurve, categoryBuffers, statusDistribution, openTickets, systemTelemetry } = timeSeriesData;

  const content = (
    <div className={`space-y-6 ${isKioskMode ? 'p-6 bg-[#0c0d12] min-h-screen text-slate-100' : 'p-6 max-w-7xl mx-auto'}`}>
      {/* Top Executive Telemetry Ribbon & Controls */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>In-App Studio: Active (Zero Installation)</span>
          </div>

          <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg font-mono flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>RSS: {systemTelemetry.memoryRssMb} MB</span>
          </div>

          <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg font-mono flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Uptime: {Math.floor(systemTelemetry.uptimeSeconds / 60)}m</span>
          </div>

          {autoRefreshSecs > 0 && (
            <div className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg font-mono text-[11px] flex items-center space-x-1">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh in {countdown}s</span>
            </div>
          )}

          {kpiSummary.joinerShortfall > 0 && (
            <div className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg font-semibold flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{kpiSummary.joinerShortfall} Hardware Deficit</span>
            </div>
          )}
        </div>

        {/* Right Side Operational Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-semibold">
            {(['1h', '6h', '24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === r
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Auto Refresh Dropdown */}
          <select
            value={autoRefreshSecs}
            onChange={(e) => setAutoRefreshSecs(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
            title="Auto-refresh polling interval"
          >
            <option value={0}>Pause Refresh</option>
            <option value={5}>Every 5s</option>
            <option value={15}>Every 15s</option>
            <option value={30}>Every 30s</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs transition"
            title="Download CSV metrics report"
          >
            <Download className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Fullscreen TV Kiosk Button */}
          <button
            onClick={() => setIsKioskMode(!isKioskMode)}
            className={`p-1.5 border rounded-lg text-xs transition flex items-center space-x-1 ${
              isKioskMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title={isKioskMode ? 'Exit Kiosk Mode (Esc)' : 'Enter TV Wallboard Kiosk Mode'}
          >
            {isKioskMode ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchTelemetry()}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs transition"
            title="Force refresh telemetry now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {exportToast && (
        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{exportToast}</span>
        </div>
      )}

      {/* Primary Sub-Tab Switcher (Hidden in Kiosk Mode for clean Wallboard view) */}
      {!isKioskMode && (
        <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('studio')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'studio'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>100% In-App Telemetry & Analytics Studio (Built-in)</span>
          </button>
          <button
            onClick={() => setActiveTab('prometheus')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'prometheus'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Raw OpenMetrics Scrape Stream (/api/metrics)</span>
          </button>
          <button
            onClick={() => setActiveTab('external-grafana')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'external-grafana'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>External Corporate Grafana Integration (Optional)</span>
          </button>
        </div>
      )}

      {/* TAB 1: 100% IN-APP NATIVE DASHBOARD & TELEMETRY STUDIO */}
      {(activeTab === 'studio' || isKioskMode) && (
        <div className="space-y-6 animate-in fade-in">
          {/* Domain Quick Filter Bar */}
          {!isKioskMode && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-semibold">Domain Filter:</span>
                <div className="flex space-x-1.5 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setDomainFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      domainFilter === 'all'
                        ? 'bg-slate-800 text-indigo-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Domains
                  </button>
                  <button
                    onClick={() => setDomainFilter('itam')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      domainFilter === 'itam'
                        ? 'bg-slate-800 text-indigo-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    IT Inventory (ITAM)
                  </button>
                  <button
                    onClick={() => setDomainFilter('itsm')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      domainFilter === 'itsm'
                        ? 'bg-slate-800 text-indigo-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Service Desk (ITSM)
                  </button>
                  <button
                    onClick={() => setDomainFilter('hr')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      domainFilter === 'hr'
                        ? 'bg-slate-800 text-indigo-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Workforce (HR)
                  </button>
                </div>
              </div>

              <div className="text-slate-400 text-xs flex items-center space-x-1.5">
                <span>Window: <strong>{timeRange.toUpperCase()}</strong></span>
                <span>•</span>
                <span className="text-indigo-400 font-mono">Real-time Reactive Redraw</span>
              </div>
            </div>
          )}

          {/* Top KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* KPI 1 */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 shadow-sm transition">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Total Fleet</span>
                <Boxes className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-100">{kpiSummary.totalAssets}</span>
                <span className="text-xs text-slate-400">units</span>
              </div>
              <p className="mt-2 text-[11px] text-indigo-400 font-medium">
                {kpiSummary.utilizationRate}% Fleet Deployed
              </p>
            </div>

            {/* KPI 2 */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 shadow-sm transition">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Ready Stock Buffer</span>
                <Boxes className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-emerald-400">{kpiSummary.inStockCount}</span>
                <span className="text-xs text-slate-400">/ {kpiSummary.totalAssets} in store</span>
              </div>
              <p className="mt-2 text-[11px] text-emerald-400 font-medium">
                Immediate Dispatch Ready
              </p>
            </div>

            {/* KPI 3 */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 shadow-sm transition">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Joiner Deficit</span>
                <Radio className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className={`text-2xl font-black ${kpiSummary.joinerShortfall > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {kpiSummary.joinerShortfall > 0 ? `-${kpiSummary.joinerShortfall}` : '0 Deficit'}
                </span>
                <span className="text-xs text-slate-400">({kpiSummary.upcomingJoiners} Joiners)</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 font-mono">
                {kpiSummary.laptopsInStock} Laptops in Store
              </p>
            </div>

            {/* KPI 4 */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-xl p-4 shadow-sm transition">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>ITSM Incidents</span>
                <Headphones className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-100">{kpiSummary.openTicketsCount}</span>
                <span className="text-xs text-slate-400">active</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 font-mono">
                {kpiSummary.slaBreachedCount > 0 ? (
                  <span className="text-rose-400 font-bold">⚠️ {kpiSummary.slaBreachedCount} SLA Breached</span>
                ) : (
                  <span className="text-emerald-400">✓ All SLAs On-Track</span>
                )}
              </p>
            </div>

            {/* KPI 5 */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 shadow-sm transition">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Net Book Value</span>
                <TrendingDown className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-cyan-400">
                  ₹{Math.round(kpiSummary.netBookValue / 1000).toLocaleString()}k
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  CapEx: ₹{Math.round(kpiSummary.totalCapEx / 1000).toLocaleString()}k
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 font-medium">
                Straight-Line Depreciation
              </p>
            </div>
          </div>

          {/* ROW 2: CORE VISUALIZATIONS (RECHARTS BAR & DONUT ALLOCATION) */}
          {(domainFilter === 'all' || domainFilter === 'itam') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Chart A: Hardware Category Safety Stock Buffer Radar (7 cols) */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      Hardware Safety Stock Radar (In-Stock vs Minimum Buffer)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Dynamic Tenant Catalog Thresholds
                  </span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBuffers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: any, name: any) => [
                          `${value} units`,
                          name === 'inStock' ? 'In-Stock Ready' : 'Minimum Safety Buffer',
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="inStock" name="In-Stock Units" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="minBuffer" name="Target Safety Buffer" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart B: Hardware Fleet Allocation Distribution (5 cols) */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <PieIcon className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-bold text-slate-100">
                        Hardware Fleet Status Allocation
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {kpiSummary.totalAssets} Total Assets
                    </span>
                  </div>

                  <div className="h-56 w-full pt-2 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value: any) => [`${value} units`, 'Count']}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-[11px] flex items-center justify-between text-slate-400">
                  <span>Assigned Deployments: <strong>{kpiSummary.utilizationRate}%</strong></span>
                  <span className="text-emerald-400 font-bold">{kpiSummary.inStockCount} Units Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* ROW 3: TIME-SERIES CURVES (ITSM VELOCITY & STRAIGHT-LINE DEPRECIATION) */}
          {(domainFilter === 'all' || domainFilter === 'itsm' || domainFilter === 'itam') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Chart C: ITSM Incident Influx & Resolution Velocity (6 cols) */}
              {(domainFilter === 'all' || domainFilter === 'itsm') && (
                <div className={`${domainFilter === 'itsm' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Headphones className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold text-slate-100">
                        ITSM Incident Stream & Resolution Velocity ({timeRange.toUpperCase()})
                      </h3>
                    </div>
                    <span className="text-[11px] text-purple-400 font-mono">
                      SLA Escalations Tracked
                    </span>
                  </div>

                  <div className="h-60 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ticketVelocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                        <Area type="monotone" dataKey="created" name="New Incidents" stroke="#a855f7" fillOpacity={1} fill="url(#colorCreated)" />
                        <Area type="monotone" dataKey="resolved" name="Resolved Tickets" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Chart D: 36-Month Straight-Line Asset Depreciation Curve (6 cols) */}
              {(domainFilter === 'all' || domainFilter === 'itam') && (
                <div className={`${domainFilter === 'itam' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-slate-100">
                        Fleet Financial Trajectory (36-Month Straight-Line Schedule)
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      CapEx vs Net Book Value
                    </span>
                  </div>

                  <div className="h-60 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={depreciationCurve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorNbv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Value']}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                        <Line type="monotone" dataKey="capEx" name="Procurement CapEx Baseline" stroke="#64748b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="netBookValue" name="Net Book Value (INR)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorNbv)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROW 4: WORKFORCE PUNCH STREAM & LIVE INCIDENT SLA QUEUE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Workforce Punch Activity (5 cols) */}
            {(domainFilter === 'all' || domainFilter === 'hr') && (
              <div className={`${domainFilter === 'hr' ? 'lg:col-span-12' : 'lg:col-span-5'} bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      Workforce Attendance Punch Velocity
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Mobile GPS vs Biometric
                  </span>
                </div>

                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={punchActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="mobileGps" name="Mobile GPS Punches" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="biometric" name="Biometric Device Punches" fill="#38bdf8" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Live Active Incident Queue (7 cols) */}
            {(domainFilter === 'all' || domainFilter === 'itsm') && (
              <div className={`${domainFilter === 'itsm' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      NOC Live Service Desk Queue & SLA Escalations
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {openTickets.length} active tickets
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-mono uppercase">
                        <th className="pb-2">Ticket #</th>
                        <th className="pb-2">Title</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Priority</th>
                        <th className="pb-2 text-right">SLA Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {openTickets.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 font-mono text-purple-400 font-bold">{t.ticketNumber}</td>
                          <td className="py-2.5 text-slate-200 font-medium max-w-[180px] truncate">{t.title}</td>
                          <td className="py-2.5 text-slate-400">{t.category}</td>
                          <td className="py-2.5">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                t.priority === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono text-[10px]">
                            {t.isSlaBreached ? (
                              <span className="text-rose-400 font-bold flex items-center justify-end">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                BREACHED
                              </span>
                            ) : (
                              <span className="text-emerald-400">ON-TRACK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RAW PROMETHEUS OPENMETRICS STREAM */}
      {activeTab === 'prometheus' && !isKioskMode && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-bold">
                Live Prometheus OpenMetrics Endpoint: <code className="text-indigo-400">/api/metrics</code>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyEndpoint}
                className="flex items-center space-x-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold"
              >
                {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{copiedEndpoint ? 'Copied' : 'Copy Scrape URL'}</span>
              </button>
              <button
                onClick={fetchPromMetrics}
                disabled={isLoadingProm}
                className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProm ? 'animate-spin' : ''}`} />
                <span>Refresh Stream</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400/90 overflow-x-auto max-h-[600px] leading-relaxed shadow-inner">
            <pre>{promMetrics || '# Loading metrics stream...'}</pre>
          </div>
        </div>
      )}

      {/* TAB 3: OPTIONAL EXTERNAL GRAFANA INTEGRATION */}
      {activeTab === 'external-grafana' && !isKioskMode && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 text-xs">
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-200 font-bold">External Corporate Grafana Integration</span>
            </div>
            <p className="text-slate-400">
              If your enterprise already runs a centralized Grafana instance (e.g. Grafana Cloud, AWS Managed Grafana, or an internal cluster), you can embed it here or configure it to scrape EmpOps via <code className="text-indigo-400 font-mono">/api/metrics</code>.
            </p>

            <div className="flex flex-col md:flex-row md:items-center gap-3 pt-1">
              <div className="flex items-center space-x-2 flex-1 max-w-xl">
                <span className="text-slate-400 font-semibold shrink-0">External URL:</span>
                <input
                  type="text"
                  value={externalGrafanaUrl}
                  onChange={(e) => setExternalGrafanaUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono outline-none focus:border-indigo-500"
                />
              </div>
              <a
                href={externalGrafanaUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-h-[550px] relative">
            <iframe
              src={externalGrafanaUrl}
              title="External Corporate Grafana"
              className="w-full h-[550px] border-0"
            />
          </div>
        </div>
      )}
    </div>
  );

  return content;
};
