import React, { useEffect, useState } from 'react';
import {
  Clock,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Compass,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  Sparkles,
  Activity,
  Smartphone,
  Fingerprint,
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
import { useAuth } from '../context/AuthContext';

export const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'punches' | 'analytics' | 'leaves'>('punches');
  const [isLoading, setIsLoading] = useState(true);

  // Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leaveType: 'CASUAL_LEAVE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    reason: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dailyRes, leaveRes] = await Promise.all([
        api.get('/attendance/daily'),
        api.get('/attendance/leave'),
      ]);
      setDailyRecords(dailyRes.data);
      setLeaves(leaveRes.data);
    } catch (e) {
      console.error('Failed to load attendance records:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.employeeId) {
      alert('Your user account is not linked to an employee profile.');
      return;
    }
    try {
      await api.post('/attendance/leave', {
        employeeId: user.employeeId,
        ...newLeave,
      });
      setShowLeaveModal(false);
      fetchData();
      alert('Leave application submitted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to apply for leave');
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/attendance/leave/${leaveId}/status`, { status, comments: `Marked ${status} via HR portal` });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update leave status');
    }
  };

  // Analytics Computations
  const totalPunches = dailyRecords.length;
  const presentCount = dailyRecords.filter((d) => d.status === 'PRESENT').length;
  const lateCount = dailyRecords.filter((d) => d.isLate).length;
  const halfDayCount = dailyRecords.filter((d) => d.status === 'HALF_DAY').length;
  const onTimeCount = Math.max(0, presentCount - lateCount);
  const geofencedPunches = dailyRecords.filter((d) => d.geofenceVerified !== false).length;
  const geofenceComplianceRate = totalPunches > 0 ? Math.round((geofencedPunches / totalPunches) * 100) : 100;
  const approvedLeavesCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const pendingLeavesCount = leaves.filter((l) => l.status === 'PENDING').length;

  // Punch arrival timeline (8:00 AM to 11:30 AM bell curve)
  const arrivalBellCurve = [
    { time: '08:00', arrivals: 1, onTime: 1, late: 0 },
    { time: '08:30', arrivals: 3, onTime: 3, late: 0 },
    { time: '09:00', arrivals: 7, onTime: 7, late: 0 },
    { time: '09:15', arrivals: 4, onTime: 4, late: 0 },
    { time: '09:30', arrivals: 3, onTime: 1, late: 2 },
    { time: '10:00', arrivals: 2, onTime: 0, late: 2 },
    { time: '10:30', arrivals: 1, onTime: 0, late: 1 },
  ];

  // Punctuality Status Donut
  const punctualityData = [
    { name: 'On-Time', value: Math.max(1, onTimeCount), color: '#10b981' },
    { name: 'Late Arrival', value: Math.max(1, lateCount), color: '#f59e0b' },
    { name: 'Half Day', value: Math.max(0, halfDayCount), color: '#ec4899' },
    { name: 'On Leave', value: Math.max(1, approvedLeavesCount), color: '#6366f1' },
  ].filter((d) => d.value > 0);

  // Punching Mode Comparison
  const checkInModeData = [
    { mode: 'Headquarters (Bangalore)', mobileGps: 8, biometricTerminal: 4 },
    { mode: 'Tech Park (Hyderabad)', mobileGps: 5, biometricTerminal: 3 },
    { mode: 'Remote / Field Sales', mobileGps: 6, biometricTerminal: 0 },
  ];

  // Leave Distribution by Type
  const leaveTypesCounts = leaves.reduce((acc: Record<string, number>, l) => {
    const t = l.leaveType?.replace('_', ' ') || 'Casual Leave';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const leaveChartData = Object.entries(leaveTypesCounts).map(([type, count]) => ({
    name: type,
    count,
  }));

  const exportAttendanceCsv = () => {
    const headers = ['Employee', 'Date', 'First Check-In', 'Last Check-Out', 'Status', 'Late Mark', 'Duration (Min)'];
    const rows = dailyRecords.map((r) => [
      `"${r.employee?.firstName || ''} ${r.employee?.lastName || ''}"`,
      r.date,
      r.firstCheckIn ? new Date(r.firstCheckIn).toLocaleTimeString() : '',
      r.lastCheckOut ? new Date(r.lastCheckOut).toLocaleTimeString() : '',
      r.status,
      r.isLate ? 'YES' : 'NO',
      r.workDurationMinutes || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EmpOps_Attendance_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Sub Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('punches')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'punches'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today's Attendance Register ({dailyRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-300" />
            <span>Smart Attendance & Shift Analytics Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'leaves'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leave Management & Approvals ({leaves.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'analytics' && (
            <button
              onClick={exportAttendanceCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendance CSV</span>
            </button>
          )}

          {activeTab === 'leaves' && (
            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Apply For Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini Executive KPI Strip (Shared Across Tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Today's Influx</span>
          <div className="text-xl font-black text-slate-100 mt-1">{totalPunches}</div>
          <p className="text-[10px] text-emerald-400 mt-0.5">{onTimeCount} on-time arrivals</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Late Marks</span>
          <div className={`text-xl font-black mt-1 ${lateCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
            {lateCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">&gt;15 min shift grace</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">GPS Geofence</span>
          <div className="text-xl font-black text-emerald-400 mt-1">{geofenceComplianceRate}%</div>
          <p className="text-[10px] text-emerald-400 mt-0.5">250m Radius Verified</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Approved Leaves</span>
          <div className="text-xl font-black text-indigo-400 mt-1">{approvedLeavesCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">{pendingLeavesCount} pending approval</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Hardware Mode</span>
          <div className="text-xl font-black text-cyan-400 mt-1">Hybrid</div>
          <p className="text-[10px] text-slate-400 mt-0.5">GPS + eSSL / ZKTeco</p>
        </div>
      </div>

      {/* SUB-TAB 1: SMART ATTENDANCE & SHIFT ANALYTICS STUDIO */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Row 1: Daily Arrival Bell Curve & Punctuality Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 1: Daily Clock-In Influx Distribution (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    Daily Clock-In Influx Bell Curve (Morning Shift Arrival)
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Peak: 09:00 - 09:15 AM
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={arrivalBellCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area type="monotone" dataKey="arrivals" name="Total Employee Check-Ins" stroke="#10b981" fillOpacity={1} fill="url(#colorArrivals)" />
                    <Area type="monotone" dataKey="late" name="Late Arrivals (>15m Grace)" stroke="#f43f5e" fillOpacity={1} fill="url(#colorLate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Punctuality Status Donut (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <PieIcon className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      Workforce Punctuality & Status Mix
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Today
                  </span>
                </div>

                <div className="h-56 w-full pt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={punctualityData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {punctualityData.map((entry: any, index: number) => (
                          <Cell key={`cell-punctuality-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any) => [`${val} staff`, 'Headcount']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-[11px] flex items-center justify-between text-slate-400">
                <span>Punctuality Rate: <strong>{totalPunches > 0 ? Math.round((onTimeCount / totalPunches) * 100) : 100}%</strong></span>
                <span className="text-emerald-400 font-bold">{onTimeCount} On-Time</span>
              </div>
            </div>
          </div>

          {/* Row 2: Influx by Check-In Mode & Leave Requests Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 3: Check-In Mode by Office Location (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    Ingestion Channel by Location (Mobile GPS vs Biometric)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Multi-Channel Influx
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={checkInModeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="mode" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="mobileGps" name="Mobile Geofenced GPS" fill="#06b6d4" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="biometricTerminal" name="Office Biometric Terminal" fill="#6366f1" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Leave Categories Volume (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    Leave Request Types Volume
                  </h3>
                </div>
                <span className="text-[11px] text-purple-400 font-mono">
                  {leaves.length} Applications
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaveChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Applications" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TODAY'S ATTENDANCE REGISTER */}
      {activeTab === 'punches' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Live Smart Attendance Register</h3>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Shift Grace Window: 15 min</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-semibold">Geofence Radius: 250m</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Location & Dept</th>
                  <th className="px-5 py-3">First Check-In</th>
                  <th className="px-5 py-3">Last Check-Out</th>
                  <th className="px-5 py-3 text-center">Work Duration</th>
                  <th className="px-5 py-3">Punctuality</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dailyRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-200">
                      {rec.employee?.firstName} {rec.employee?.lastName}
                      <span className="block text-[10px] text-slate-500 font-mono">{rec.employee?.employeeCode}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      <span>{rec.employee?.location?.name || 'HQ Office'}</span>
                      <span className="block text-[10px] text-slate-500">{rec.employee?.department?.name}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {rec.firstCheckIn ? new Date(rec.firstCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {rec.lastCheckOut ? new Date(rec.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Working...'}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-slate-200">
                      {rec.workDurationMinutes ? `${Math.floor(rec.workDurationMinutes / 60)}h ${rec.workDurationMinutes % 60}m` : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      {rec.isLate ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center space-x-1 w-max">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Late Arrival
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1 w-max">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          On-Time
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : rec.status === 'HALF_DAY'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LEAVE MANAGEMENT & APPROVALS */}
      {activeTab === 'leaves' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Leave Applications & Approval Workflow</h3>
            <span className="text-xs text-slate-400">Total Leaves: {leaves.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Leave Type</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Days</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-200">
                      {l.employee?.firstName} {l.employee?.lastName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-purple-400 font-semibold">{l.leaveType}</td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {l.startDate.split('T')[0]} to {l.endDate.split('T')[0]}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">{l.daysCount} Day(s)</td>
                    <td className="px-5 py-3.5 text-slate-400 max-w-[200px] truncate">{l.reason || 'Personal'}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : l.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {l.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleUpdateLeaveStatus(l.id, 'APPROVED')}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateLeaveStatus(l.id, 'REJECTED')}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded font-semibold text-[10px]"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Apply for Leave</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Leave Type</label>
                <select
                  value={newLeave.leaveType}
                  onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                  <option value="SICK_LEAVE">Sick Leave (SL)</option>
                  <option value="EARNED_LEAVE">Earned / Privilege Leave (PL)</option>
                  <option value="COMPENSATORY_OFF">Compensatory Off (Comp-Off)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain reason for leave..."
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
