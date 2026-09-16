import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  UserPlus,
  FileSpreadsheet,
  Laptop,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Download,
  Search,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Building2,
  Briefcase,
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

export const HrOperationsView: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [musterRoll, setMusterRoll] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'muster' | 'analytics'>('directory');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState<any>(null);

  // New Employee Form
  const [newEmp, setNewEmp] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designationId: '',
    locationId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    autoProvisionHardware: true,
  });

  // Resign Form
  const [resignData, setResignData] = useState({
    resignationDate: new Date().toISOString().split('T')[0],
    lastWorkingDay: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    reason: 'Career progression / personal reasons',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [empRes, deptRes, desRes, locRes, musterRes] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/hr/departments'),
        api.get('/hr/designations'),
        api.get('/hr/locations'),
        api.get('/attendance/muster-roll'),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setDesignations(desRes.data);
      setLocations(locRes.data);
      setMusterRoll(musterRes.data);

      if (deptRes.data[0]) setNewEmp((prev) => ({ ...prev, departmentId: deptRes.data[0].id }));
      if (desRes.data[0]) setNewEmp((prev) => ({ ...prev, designationId: desRes.data[0].id }));
      if (locRes.data[0]) setNewEmp((prev) => ({ ...prev, locationId: locRes.data[0].id }));
    } catch (e) {
      console.error('Failed to load HR data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/hr/employees', newEmp);
      setShowAddModal(false);
      fetchData();
      alert('Employee created successfully! IT hardware provisioning ticket has been generated.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create employee');
    }
  };

  const handleResignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResignModal) return;
    try {
      await api.post(`/hr/employees/${showResignModal.id}/resign`, resignData);
      setShowResignModal(null);
      fetchData();
      alert('Resignation recorded. Exit clearance and IT asset recovery ticket initiated.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record resignation');
    }
  };

  const exportMusterRollCsv = () => {
    if (!musterRoll?.musterRoll) return;
    const headers = ['Employee Code', 'Name', 'Department', 'Total Recorded Days', 'Present Days', 'Half Days', 'Absent Days', 'Late Marks', 'Effective Pay Days'];
    const rows = musterRoll.musterRoll.map((r: any) => [
      r.employeeCode,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      r.totalRecordedDays,
      r.presentDays,
      r.halfDays,
      r.absentDays,
      r.lateMarks,
      r.effectivePayDays,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Muster_Roll_Form25_${musterRoll.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDirectoryCsv = () => {
    const headers = ['Employee Code', 'First Name', 'Last Name', 'Email', 'Department', 'Designation', 'Location', 'Status', 'Joining Date'];
    const rows = employees.map((emp) => [
      emp.employeeCode,
      `"${emp.firstName}"`,
      `"${emp.lastName}"`,
      emp.email,
      `"${emp.departmentName || ''}"`,
      `"${emp.designationTitle || ''}"`,
      `"${emp.locationName || ''}"`,
      emp.status,
      emp.joiningDate || '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EmpOps_Employee_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.departmentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Workforce Analytics Computations
  const totalHeadcount = employees.length;
  const confirmedCount = employees.filter((e) => e.status === 'CONFIRMED').length;
  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;
  const noticeCount = employees.filter((e) => e.status === 'NOTICE_PERIOD').length;
  const assignedDeviceCount = employees.filter((e) => e.assignedAssets?.length > 0).length;
  const hardwareCoverageRate = totalHeadcount > 0 ? Math.round((assignedDeviceCount / totalHeadcount) * 100) : 0;

  // Department distribution
  const deptCounts = employees.reduce((acc: Record<string, number>, e) => {
    const dept = e.departmentName || 'General';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const deptColors = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
  const departmentChartData = Object.entries(deptCounts).map(([dept, count], i) => ({
    name: dept,
    value: count,
    color: deptColors[i % deptColors.length],
  }));

  // Employment Type distribution
  const empTypeCounts = employees.reduce((acc: Record<string, number>, e) => {
    const t = e.employmentType || 'FULL_TIME';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const empTypeChartData = Object.entries(empTypeCounts).map(([type, count], i) => ({
    name: type.replace('_', ' '),
    value: count,
    color: ['#10b981', '#6366f1', '#f59e0b', '#64748b'][i % 4],
  }));

  // Headcount growth curve simulation
  const headcountTimeline = [
    { month: 'Jan', headcount: Math.max(2, totalHeadcount - 6), joiners: 2, exits: 0 },
    { month: 'Feb', headcount: Math.max(3, totalHeadcount - 5), joiners: 1, exits: 0 },
    { month: 'Mar', headcount: Math.max(4, totalHeadcount - 4), joiners: 2, exits: 1 },
    { month: 'Apr', headcount: Math.max(6, totalHeadcount - 2), joiners: 3, exits: 1 },
    { month: 'May', headcount: Math.max(7, totalHeadcount - 1), joiners: 2, exits: 0 },
    { month: 'Jun (Now)', headcount: totalHeadcount, joiners: 2, exits: noticeCount },
  ];

  // Department Attendance & Muster Days comparison
  const musterDepartmentData = Object.keys(deptCounts).map((dept) => {
    const deptMuster = musterRoll?.musterRoll?.filter((r: any) => r.department === dept) || [];
    const avgPresent = deptMuster.length > 0
      ? Math.round(deptMuster.reduce((s: number, r: any) => s + (r.presentDays || 0), 0) / deptMuster.length)
      : 22;
    const avgHalfDays = deptMuster.length > 0
      ? Math.round(deptMuster.reduce((s: number, r: any) => s + (r.halfDays || 0), 0) / deptMuster.length)
      : 1;
    const avgLate = deptMuster.length > 0
      ? Math.round(deptMuster.reduce((s: number, r: any) => s + (r.lateMarks || 0), 0) / deptMuster.length)
      : 2;

    return {
      department: dept,
      avgPresent,
      avgHalfDays,
      avgLate,
    };
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Actions & Sub-Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeSubTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employee Directory ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeSubTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-300" />
            <span>Workforce Intelligence & Headcount Studio</span>
          </button>

          <button
            onClick={() => setActiveSubTab('muster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeSubTab === 'muster'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Monthly Muster Roll (Form 25)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {activeSubTab === 'directory' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Employee</span>
            </button>
          )}

          {activeSubTab === 'analytics' && (
            <button
              onClick={exportDirectoryCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Workforce Data (CSV)</span>
            </button>
          )}

          {activeSubTab === 'muster' && (
            <button
              onClick={exportMusterRollCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Payroll CSV (Tally / greytHR)</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini Executive Headcount Ribbon (Visible across all subtabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Headcount</span>
          <div className="text-xl font-black text-slate-100 mt-1">{totalHeadcount}</div>
          <p className="text-[10px] text-indigo-400 mt-0.5">{departments.length} Departments</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Confirmed Active</span>
          <div className="text-xl font-black text-emerald-400 mt-1">{confirmedCount}</div>
          <p className="text-[10px] text-emerald-400 mt-0.5">Permanent staff</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Probation / Joiners</span>
          <div className="text-xl font-black text-indigo-400 mt-1">{probationCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Auto-provisioned</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Exit Notice Period</span>
          <div className={`text-xl font-black mt-1 ${noticeCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
            {noticeCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{noticeCount > 0 ? 'IT NOC Locked' : 'Clearances nominal'}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Hardware Custody</span>
          <div className="text-xl font-black text-purple-400 mt-1">{hardwareCoverageRate}%</div>
          <p className="text-[10px] text-slate-400 mt-0.5">{assignedDeviceCount} with devices</p>
        </div>
      </div>

      {/* SUB-TAB 1: WORKFORCE INTELLIGENCE & ANALYTICS STUDIO */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Row 1: Headcount Growth Curve & Department Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 1: Headcount Growth Trajectory (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    Headcount Growth & Joiner Velocity (6-Month Trajectory)
                  </h3>
                </div>
                <span className="text-[11px] text-purple-400 font-mono">
                  Net Talent Expansion
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={headcountTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHeadcount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area type="monotone" dataKey="headcount" name="Total Headcount" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHeadcount)" />
                    <Bar dataKey="joiners" name="New Joiners" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Department Headcount Distribution (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <PieIcon className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      Workforce Allocation by Department
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {totalHeadcount} Employees
                  </span>
                </div>

                <div className="h-56 w-full pt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentChartData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {departmentChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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
                <span>Primary Function: <strong>Engineering</strong></span>
                <span className="text-emerald-400 font-bold">{confirmedCount} Confirmed Staff</span>
              </div>
            </div>
          </div>

          {/* Row 2: Attendance Muster Performance & Employment Type */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 3: Form 25 Attendance Days by Department (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    Form 25 Average Recorded Days by Department
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Present vs Half Days
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={musterDepartmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="avgPresent" name="Avg Present Days" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgHalfDays" name="Avg Half Days" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgLate" name="Avg Late Marks" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Employment Type Allocation (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      Employment Contracts Breakdown
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Contracts
                  </span>
                </div>

                <div className="h-56 w-full pt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={empTypeChartData}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {empTypeChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-type-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any) => [`${val} personnel`, 'Count']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-[11px] flex items-center justify-between text-slate-400">
                <span>Payroll Readiness: <strong>100%</strong></span>
                <span className="text-indigo-400 font-bold">Form 25 Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMPLOYEE DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, code, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium">Showing {filteredEmployees.length} employees</span>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department & Role</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Assigned Hardware</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-300">{emp.designationTitle}</p>
                      <p className="text-[11px] text-slate-400">{emp.departmentName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">{emp.locationName}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          emp.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : emp.status === 'PROBATION'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {emp.assignedAssets?.length > 0 ? (
                        <div className="flex items-center space-x-1 text-slate-300">
                          <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{emp.assignedAssets.length} Device(s)</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">None Assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {emp.status !== 'NOTICE_PERIOD' && emp.status !== 'EXITED' && (
                        <button
                          onClick={() => setShowResignModal(emp)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-[11px] font-semibold transition"
                        >
                          Initiate Exit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MONTHLY MUSTER ROLL (FORM 25) */}
      {activeSubTab === 'muster' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Form 25 Statutory Monthly Muster Roll & Attendance Register</span>
              </h3>
              <p className="text-xs text-slate-400">
                Month: <strong>{musterRoll?.month}</strong> • Standard 28-31 Day Payable Days Computation
              </p>
            </div>
            <button
              onClick={exportMusterRollCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Form 25 CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Employee Name</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5 text-center">Recorded Days</th>
                  <th className="px-4 py-2.5 text-center text-emerald-400">Present</th>
                  <th className="px-4 py-2.5 text-center text-amber-400">Half Days</th>
                  <th className="px-4 py-2.5 text-center text-rose-400">Absent</th>
                  <th className="px-4 py-2.5 text-center text-orange-400">Late Marks</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-200">Effective Pay Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {musterRoll?.musterRoll?.map((m: any) => (
                  <tr key={m.employeeId} className="hover:bg-slate-800/30 transition font-mono">
                    <td className="px-4 py-2 text-indigo-400">{m.employeeCode}</td>
                    <td className="px-4 py-2 font-sans font-semibold text-slate-200">{m.employeeName}</td>
                    <td className="px-4 py-2 font-sans text-slate-400">{m.department}</td>
                    <td className="px-4 py-2 text-center text-slate-300">{m.totalRecordedDays}</td>
                    <td className="px-4 py-2 text-center text-emerald-400">{m.presentDays}</td>
                    <td className="px-4 py-2 text-center text-amber-400">{m.halfDays}</td>
                    <td className="px-4 py-2 text-center text-rose-400">{m.absentDays}</td>
                    <td className="px-4 py-2 text-center text-orange-400">{m.lateMarks}</td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-400">{m.effectivePayDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboard Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100">Onboard New Employee</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.firstName}
                    onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.lastName}
                    onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department</label>
                  <select
                    value={newEmp.departmentId}
                    onChange={(e) => setNewEmp({ ...newEmp, departmentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Designation</label>
                  <select
                    value={newEmp.designationId}
                    onChange={(e) => setNewEmp({ ...newEmp, designationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Location</label>
                  <select
                    value={newEmp.locationId}
                    onChange={(e) => setNewEmp({ ...newEmp, locationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-lg flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoProvision"
                  checked={newEmp.autoProvisionHardware}
                  onChange={(e) => setNewEmp({ ...newEmp, autoProvisionHardware: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="autoProvision" className="cursor-pointer">
                  <p className="font-semibold text-slate-200">Auto-Generate IT Provisioning Ticket (Trinity Wedge)</p>
                  <p className="text-[11px] text-slate-400">
                    Instantly creates ticket in IT Service Desk to prepare laptop and sign custody certificate.
                  </p>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resignation / Exit Modal */}
      {showResignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <LogOut className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-slate-100">
                Initiate Resignation & Exit Clearance: {showResignModal.firstName} {showResignModal.lastName}
              </h3>
            </div>

            <form onSubmit={handleResignEmployee} className="space-y-4 text-xs">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 space-y-1">
                <p className="font-semibold">⚠️ Full & Final Settlement Lock Active</p>
                <p className="text-[11px] text-rose-400/90">
                  Submitting will lock the employee's payroll release. IT NOC will remain BLOCKED until all assigned
                  devices are physically verified and returned.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Resignation Date</label>
                <input
                  type="date"
                  required
                  value={resignData.resignationDate}
                  onChange={(e) => setResignData({ ...resignData, resignationDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Last Working Day (LWD)</label>
                <input
                  type="date"
                  required
                  value={resignData.lastWorkingDay}
                  onChange={(e) => setResignData({ ...resignData, lastWorkingDay: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Reason for Separation</label>
                <textarea
                  rows={2}
                  required
                  value={resignData.reason}
                  onChange={(e) => setResignData({ ...resignData, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowResignModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Submit & Initiate Exit Lock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
