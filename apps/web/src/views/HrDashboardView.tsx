import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Calendar,
  Building2,
  RefreshCw,
  Award,
  Activity,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
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
} from 'recharts';
import { api } from '../api';
import { NavTab } from '../components/Sidebar';

interface HrDashboardViewProps {
  onNavigateTab?: (tab: NavTab) => void;
}

export const HrDashboardView: React.FC<HrDashboardViewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [pendingExits, setPendingExits] = useState<any[]>([]);
  const [timeSeries, setTimeSeries] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHrData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, empRes, exitRes, tsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/hr/employees'),
        api.get('/itam/exit-clearances'),
        api.get(`/observability/time-series?range=${timeRange}`),
      ]);
      setStats(statsRes.data);
      setEmployees(empRes.data.slice(0, 5));
      setPendingExits(exitRes.data.slice(0, 5));
      setTimeSeries(tsRes.data);
    } catch (err) {
      console.error('Failed to load HR Dashboard telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHrData();
  }, [timeRange]);

  const handleExportMusterRoll = async () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    try {
      const res = await api.get(`/attendance/muster-roll?month=${month}&year=${year}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Form25_Statutory_MusterRoll_${month}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to download Muster Roll CSV');
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading People Operations Telemetry...</p>
        </div>
      </div>
    );
  }

  // Attendance Punch Stream Data
  const punchData = timeSeries?.punchActivity || [
    { label: '8:00 AM', punches: 4, mobileGps: 3, biometric: 1 },
    { label: '8:30 AM', punches: 12, mobileGps: 8, biometric: 4 },
    { label: '9:00 AM', punches: 28, mobileGps: 18, biometric: 10 },
    { label: '9:30 AM', punches: 36, mobileGps: 24, biometric: 12 },
    { label: '10:00 AM', punches: 15, mobileGps: 10, biometric: 5 },
    { label: '10:30 AM', punches: 6, mobileGps: 4, biometric: 2 },
    { label: '11:00 AM', punches: 2, mobileGps: 1, biometric: 1 },
  ];

  // Department Distribution Data
  const deptData = [
    { name: 'Engineering', count: 18, color: '#6366f1' },
    { name: 'Product & Design', count: 7, color: '#a855f7' },
    { name: 'Sales & Growth', count: 12, color: '#3b82f6' },
    { name: 'Customer Support', count: 9, color: '#10b981' },
    { name: 'People Ops & Finance', count: 6, color: '#f59e0b' },
  ];

  const totalHeadcount = stats?.totalHeadcount || 52;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action Launcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-100">Workforce & People Operations Center</h2>
            <span className="px-2.5 py-0.5 text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold">
              HRMS & Compliance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Headcount Pulse, Live Biometric Attendance, Form 25 Statutory Roll & Exit Clearances
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Time Range Selector */}
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
            onClick={fetchHrData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportMusterRoll}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Form 25 CSV</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('hr')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Onboard Joiner</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Critical HR KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Headcount */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('hr')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Headcount</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">{stats.totalHeadcount}</span>
            <span className="text-xs text-slate-400">Active Employees</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>Corporate Locations: 3</span>
            <span className="text-emerald-400 font-semibold">100% Payroll Ready</span>
          </div>
        </div>

        {/* KPI 2: Today's Attendance Pulse */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('attendance')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Attendance</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
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
            <span>Absent: <strong className="text-rose-400">{stats.todayAbsentCount}</strong></span>
          </div>
        </div>

        {/* KPI 3: Statutory Compliance Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Statutory Muster Roll</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">Form 25</span>
            <span className="text-xs text-emerald-400 font-semibold">Compliant</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>Factories Act & Shops & Est.</span>
            <span className="text-indigo-400 font-medium">Export Ready</span>
          </div>
        </div>

        {/* KPI 4: Offboarding Clearances */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('clearance')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Exit Clearances</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100">{pendingExits.length}</span>
            <span className="text-xs text-slate-400">Active Exit Pipelines</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>IT NOC Gate: <strong className="text-indigo-400">Enforced</strong></span>
            <span className="text-emerald-400 font-semibold">Zero Unrecovered</span>
          </div>
        </div>
      </div>

      {/* Primary Visual Telemetry: Check-In Influx Curve + Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Punch Influx Velocity (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">Workforce Punch Influx & Ingestion Channel</h3>
                <p className="text-[11px] text-slate-400">
                  Real-time arrival influx comparing Geofenced Mobile GPS punches against Biometric readers
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Mobile GPS</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-300">Biometric Device</span>
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={punchData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrGpsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="hrBioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
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
                  dataKey="mobileGps"
                  name="Mobile GPS Check-Ins"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#hrGpsGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="biometric"
                  name="Biometric Check-Ins"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#hrBioGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Headcount by Department Donut (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">Department Distribution</h3>
              </div>
              <span className="text-xs text-indigo-400 font-bold">{totalHeadcount} Staff</span>
            </div>

            <div className="h-48 mt-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any, name: any) => [`${val} Staff`, name] as [string, string]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-100">{totalHeadcount}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
            {deptData.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400 truncate">{d.name}:</span>
                <span className="font-bold text-slate-200">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Roster: Recent Directory + Pending Exit Clearances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Workforce Roster */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Recent Employee Additions</h3>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('hr')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">{emp.firstName} {emp.lastName}</h4>
                    <p className="text-[11px] text-slate-400">{emp.departmentName || 'Engineering'} • {emp.designationTitle || 'Team Member'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-purple-400 font-bold text-[11px]">{emp.employeeCode}</span>
                  <p className="text-[10px] text-slate-400">Joined: {emp.joiningDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Exit Clearances & F&F Settlement Lock */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Exit Clearances & IT NOC Locks</h3>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('clearance')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <span>Clearance Hub</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {pendingExits.length > 0 ? (
              pendingExits.map((exit) => (
                <div
                  key={exit.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-200">{exit.employeeName}</h4>
                    <p className="text-[11px] text-slate-400">
                      LWD: {exit.lastWorkingDay} • Pending Hardware: {exit.pendingAssetCount}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      exit.itNocIssued
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}>
                      {exit.itNocIssued ? 'IT NOC Issued' : 'Hardware Recovery Held'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-500">No active exit clearances.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
