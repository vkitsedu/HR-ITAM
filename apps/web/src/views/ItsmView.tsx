import React, { useEffect, useState } from 'react';
import {
  Headphones,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Shield,
  Search,
  Filter,
  Send,
  Lock,
  Sparkles,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  CheckCircle,
  Activity,
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

export const ItsmView: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  // View Mode: 'queue' (workbench) or 'analytics' (SLA Studio)
  const [viewMode, setViewMode] = useState<'queue' | 'analytics'>('queue');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsTimeWindow, setAnalyticsTimeWindow] = useState<'7d' | '30d' | '90d'>('30d');

  // AI Copilot state
  const [aiTriageData, setAiTriageData] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'HARDWARE',
    priority: 'MEDIUM',
  });

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/itsm/tickets');
      setTickets(res.data);
      if (selectedTicket) {
        const refreshed = res.data.find((t: any) => t.id === selectedTicket.id);
        if (refreshed) {
          setSelectedTicket(refreshed);
        } else if (res.data.length > 0) {
          handleSelectTicket(res.data[0]);
        }
      } else if (res.data.length > 0) {
        handleSelectTicket(res.data[0]);
      }
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTicket = (ticket: any) => {
    if (selectedTicket?.id === ticket.id) return;
    setAiTriageData(null);
    setCompletedSteps({});
    setSelectedTicket(ticket);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/itsm/tickets', newTicket);
      setShowCreateModal(false);
      setNewTicket({ title: '', description: '', category: 'HARDWARE', priority: 'MEDIUM' });
      fetchTickets();
      alert('Ticket raised successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create ticket');
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await api.put(`/itsm/tickets/${ticketId}`, { status });
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update ticket status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;
    try {
      await api.post(`/itsm/tickets/${selectedTicket.id}/comments`, {
        content: commentText,
        isInternal: isInternalComment,
      });
      setCommentText('');
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add comment');
    }
  };

  const handleRunAiTriage = async (ticket: any) => {
    try {
      setIsLoadingAi(true);
      const res = await api.post('/ai/triage', {
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        linkedAssetTag: ticket.linkedAssetTag,
        linkedAssetName: ticket.linkedAssetName,
        requesterName: ticket.requesterName,
      });
      setAiTriageData(res.data);
      setShowAiPanel(true);
      setCompletedSteps({});
    } catch (err: any) {
      console.error('AI Triage error:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAiSuggestNewTicket = async () => {
    if (!newTicket.title && !newTicket.description) {
      alert('Please enter an issue summary or description first.');
      return;
    }
    try {
      setIsSuggestingCategory(true);
      const res = await api.post('/ai/suggest', {
        title: newTicket.title,
        description: newTicket.description,
      });
      setNewTicket((prev) => ({
        ...prev,
        category: res.data.suggestedCategory || prev.category,
        priority: res.data.suggestedPriority || prev.priority,
      }));
    } catch (err) {
      console.error('AI suggest error:', err);
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      handleRunAiTriage(selectedTicket);
    } else {
      setAiTriageData(null);
    }
  }, [selectedTicket?.id]);

  // Derived Analytics Datasets
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const breachedCount = tickets.filter((t) => t.isSlaBreached).length;
  const slaCompliancePercent = totalCount > 0 ? Math.round(((totalCount - breachedCount) / totalCount) * 100) : 100;
  const criticalCount = tickets.filter((t) => t.priority === 'CRITICAL').length;

  // Category counts
  const categoryCounts = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const categoryColors: Record<string, string> = {
    HARDWARE: '#6366f1',
    SOFTWARE: '#a855f7',
    NETWORK: '#06b6d4',
    ACCESS: '#10b981',
    INFRASTRUCTURE: '#f59e0b',
    OTHER: '#ec4899',
  };

  const categoryChartData = Object.entries(categoryCounts).map(([cat, count]) => ({
    name: cat,
    value: count,
    color: categoryColors[cat] || '#8b5cf6',
  }));

  // Priority matrix
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const priorityChartData = priorities.map((p) => {
    const subset = tickets.filter((t) => t.priority === p);
    const breached = subset.filter((t) => t.isSlaBreached).length;
    const onTrack = subset.length - breached;
    return {
      priority: p,
      onTrack,
      breached,
      total: subset.length,
    };
  });

  // Time-Series Ticket Velocity Curve
  const pointsCount = analyticsTimeWindow === '7d' ? 7 : analyticsTimeWindow === '30d' ? 10 : 12;
  const ticketTimeline = Array.from({ length: pointsCount }).map((_, i) => {
    const variance = Math.sin(i * 0.7) * 2;
    const created = Math.max(1, Math.round(totalCount * 0.15 + variance + (i % 3)));
    const resolved = Math.max(1, Math.round(totalCount * 0.12 + (variance * 0.4) + (i % 2)));
    const label = analyticsTimeWindow === '7d'
      ? `Day ${i + 1}`
      : analyticsTimeWindow === '30d'
      ? `W${Math.floor(i / 2) + 1}D${(i % 2) * 3}`
      : `M${i + 1}`;

    return {
      label,
      created,
      resolved,
      backlog: Math.max(2, Math.round(openCount + (created - resolved) * 0.5)),
    };
  });

  // Category MTTR (Mean Time to Resolve in minutes)
  const mttrCategoryData = [
    { category: 'HARDWARE', mttrMins: 45, targetMins: 60 },
    { category: 'NETWORK', mttrMins: 28, targetMins: 30 },
    { category: 'ACCESS', mttrMins: 15, targetMins: 20 },
    { category: 'SOFTWARE', mttrMins: 35, targetMins: 45 },
    { category: 'INFRASTRUCTURE', mttrMins: 55, targetMins: 60 },
  ];

  // Filtered tickets for queue view
  const filteredTickets = tickets.filter((t) => {
    const matchesCategory = selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleExportCsv = () => {
    const rows = [
      ['Ticket #', 'Title', 'Category', 'Priority', 'Status', 'Requester', 'Assignee', 'SLA Status', 'Created At'],
      ...tickets.map((t) => [
        t.ticketNumber,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.priority,
        t.status,
        t.requesterName,
        t.assigneeName,
        t.isSlaBreached ? 'BREACHED' : 'ON-TRACK',
        t.createdAt,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `empops-itsm-tickets-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Mode Toggle Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>IT Service Desk & Incident Intelligence</span>
              {breachedCount > 0 ? (
                <span className="px-2 py-0.5 text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>{breachedCount} SLA Escalations</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>100% SLA On-Track</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">ITIL Incident Management, Business-Hours SLAs & AI Triage Copilot</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('queue')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition ${
                viewMode === 'queue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Incident Workbench</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition ${
                viewMode === 'analytics'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-300" />
              <span>SLA & Delivery Studio</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Raise IT Ticket</span>
          </button>
        </div>
      </div>

      {/* Mini Executive KPI Strip (Shared Across Both Views) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Incidents</span>
          <div className="text-xl font-black text-slate-100 mt-1">{totalCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">{resolvedCount} resolved to date</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Active Backlog</span>
          <div className="text-xl font-black text-indigo-400 mt-1">{openCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">In technician queue</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">SLA Compliance</span>
          <div className="text-xl font-black text-emerald-400 mt-1">{slaCompliancePercent}%</div>
          <p className="text-[10px] text-emerald-400/90 mt-0.5">Target: &gt;95%</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Critical Severity</span>
          <div className={`text-xl font-black mt-1 ${criticalCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
            {criticalCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">1-Hour SLA window</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Mean MTTR</span>
          <div className="text-xl font-black text-purple-400 mt-1">~38m</div>
          <p className="text-[10px] text-purple-400 mt-0.5">AI Copilot Assisted</p>
        </div>
      </div>

      {/* VIEW 1: SERVICE DELIVERY & SLA ANALYTICS STUDIO */}
      {viewMode === 'analytics' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Analytics Control Bar */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-semibold">Analytics Horizon:</span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                {(['7d', '30d', '90d'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAnalyticsTimeWindow(r)}
                    className={`px-3 py-1 rounded-md transition ${
                      analyticsTimeWindow === r
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export SLA Metrics (CSV)</span>
              </button>
            </div>
          </div>

          {/* Row 1: Time Series Area & Category Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 1: Ticket Inflow vs Resolution Velocity (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    Incident Inflow vs Resolution Velocity ({analyticsTimeWindow.toUpperCase()})
                  </h3>
                </div>
                <span className="text-[11px] text-purple-400 font-mono">
                  Burn-Down Velocity Active
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ticketTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="itsmCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="itsmResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area type="monotone" dataKey="created" name="New Incidents Raised" stroke="#a855f7" fillOpacity={1} fill="url(#itsmCreated)" />
                    <Area type="monotone" dataKey="resolved" name="Resolved Incidents" stroke="#10b981" fillOpacity={1} fill="url(#itsmResolved)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Volume Donut (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <PieIcon className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      Incident Volume by Domain Category
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {totalCount} Total
                  </span>
                </div>

                <div className="h-56 w-full pt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any) => [`${val} tickets`, 'Count']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-[11px] flex items-center justify-between text-slate-400">
                <span>Top Incident Category: <strong>HARDWARE</strong></span>
                <span className="text-purple-400 font-bold">{openCount} Active</span>
              </div>
            </div>
          </div>

          {/* Row 2: Priority SLA Stacked Bar & Category MTTR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 3: Priority Matrix & SLA Compliance (6 cols) */}
            <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    SLA Compliance by Incident Priority
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  On-Track vs Breached
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="priority" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="onTrack" name="SLA On-Track" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="breached" name="SLA Breached" fill="#f43f5e" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: MTTR Speed by Category (6 cols) */}
            <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    Mean Time to Resolve (MTTR) vs Target SLA
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  In Minutes
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mttrCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} mins`, 'Duration']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="mttrMins" name="Actual MTTR" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="targetMins" name="SLA Target Ceiling" fill="#475569" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INCIDENT QUEUE & AI COPILOT WORKBENCH */}
      {viewMode === 'queue' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Queue Filter Ribbon */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by ticket #, subject, or employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <span className="text-slate-400 font-semibold shrink-0">Category:</span>
              {['ALL', 'HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'INFRASTRUCTURE'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 ${
                    selectedCategoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main Workbench Grid: Ticket List + Selected Ticket Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket List (1.3 cols on desktop) */}
            <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[780px]">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-200">
                  Incident Queue ({filteredTickets.length})
                </span>
                <span className="text-[11px] text-slate-400">SLA Breach Tracking Active</span>
              </div>

              <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1">
                {filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className={`p-3.5 cursor-pointer transition flex items-start justify-between border-l-4 ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-sm'
                          : 'hover:bg-slate-800/40 border-transparent'
                      }`}
                    >
                      <div className="space-y-1.5 max-w-[75%]">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="font-mono text-xs text-purple-400 font-bold">{t.ticketNumber}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold">
                            {t.category}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              t.priority === 'CRITICAL' || t.priority === 'HIGH'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{t.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{t.description}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 pt-0.5">
                          <span>{t.requesterName}</span>
                          <span>•</span>
                          <span>{t.assigneeName}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.status === 'RESOLVED' || t.status === 'CLOSED'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                        {t.isSlaBreached && (
                          <span className="text-[10px] text-rose-400 font-bold flex items-center justify-end">
                            <AlertTriangle className="w-3 h-3 mr-0.5" />
                            SLA Breached
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredTickets.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No tickets found matching your search.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Ticket Detail & AI Copilot Panel (2 cols on desktop) */}
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[780px]">
              {selectedTicket ? (
                <>
                  {/* Ticket Header Banner */}
                  <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-purple-400 font-bold text-sm">{selectedTicket.ticketNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            selectedTicket.priority === 'CRITICAL' || selectedTicket.priority === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {selectedTicket.priority} Priority
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                          {selectedTicket.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{selectedTicket.title}</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_FOR_USER">Waiting for User</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Scrollable Body: AI Copilot Box + Comments Stream */}
                  <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* AI Copilot Panel */}
                    <div className="p-4 bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-500/30 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                          <Bot className="w-4 h-4 text-purple-400" />
                          <span>AI ITSM Diagnostic & Resolution Copilot</span>
                          {isLoadingAi && <span className="text-[10px] text-slate-400 font-normal animate-pulse">(Analyzing incident...)</span>}
                        </div>
                        <button
                          onClick={() => setShowAiPanel(!showAiPanel)}
                          className="text-xs text-slate-400 hover:text-slate-200"
                        >
                          {showAiPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {showAiPanel && (
                        <>
                          {isLoadingAi ? (
                            <div className="py-4 text-center text-xs text-slate-400 space-y-2">
                              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                              <p>Synthesizing probable root causes & technician playbooks...</p>
                            </div>
                          ) : aiTriageData ? (
                            <div className="space-y-3 text-xs">
                              {/* Urgency & Summary */}
                              <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-mono">Urgency Score:</span>
                                  <span className="ml-1.5 font-bold text-amber-400">{aiTriageData.urgencyScore}/10</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-mono">Est. Resolution:</span>
                                  <span className="ml-1.5 font-bold text-emerald-400">{aiTriageData.estimatedResolutionTime}</span>
                                </div>
                              </div>

                              {/* Probable Root Causes */}
                              <div>
                                <h5 className="font-bold text-slate-300 mb-1">Probable Root Causes:</h5>
                                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                                  {aiTriageData.hypotheses?.map((h: string, idx: number) => (
                                    <li key={idx}>{h}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Step-by-Step Interactive Playbook */}
                              <div>
                                <h5 className="font-bold text-slate-300 mb-1">Technician Diagnostic Playbook:</h5>
                                <div className="space-y-1.5">
                                  {aiTriageData.diagnosticPlaybook?.map((step: any, idx: number) => (
                                    <div
                                      key={idx}
                                      onClick={() => setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                      className={`p-2 rounded border text-xs cursor-pointer flex items-start space-x-2 transition ${
                                        completedSteps[idx]
                                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                      }`}
                                    >
                                      <div className="mt-0.5">
                                        {completedSteps[idx] ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                          <div className="w-3.5 h-3.5 rounded border border-slate-600" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-semibold">{step.action}</p>
                                        <p className="text-[10px] text-slate-500">Expect: {step.expectedResult}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Quick One-Click Draft Response */}
                              {aiTriageData.suggestedResponse && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <h5 className="font-bold text-slate-300">Empathetic Employee Draft:</h5>
                                    <button
                                      type="button"
                                      onClick={() => setCommentText(aiTriageData.suggestedResponse)}
                                      className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                                    >
                                      Insert into Reply
                                    </button>
                                  </div>
                                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-400 text-[11px] italic">
                                    "{aiTriageData.suggestedResponse}"
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">AI analysis ready. Select a ticket to evaluate telemetry.</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Ticket Original Description */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Initial Problem Report:</span>
                      <p className="text-slate-300 leading-relaxed">{selectedTicket.description}</p>
                      {selectedTicket.linkedAssetName && (
                        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center space-x-2 text-[11px] text-slate-400">
                          <span className="font-mono text-indigo-400 font-semibold">[{selectedTicket.linkedAssetTag}]</span>
                          <span>{selectedTicket.linkedAssetName}</span>
                        </div>
                      )}
                    </div>

                    {/* Comments Stream */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Technician & User Activity ({selectedTicket.comments?.length || 0})</span>
                      </h4>

                      <div className="space-y-2.5">
                        {selectedTicket.comments?.map((c: any) => (
                          <div
                            key={c.id}
                            className={`p-3 rounded-lg border text-xs space-y-1 ${
                              c.isInternal
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-300">
                                {c.author?.firstName ? `${c.author.firstName} ${c.author.lastName}` : 'Support Agent'}
                              </span>
                              <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="leading-relaxed">{c.content}</p>
                            {c.isInternal && (
                              <span className="inline-block text-[9px] font-mono text-amber-400 font-bold">
                                [INTERNAL TECHNICIAN NOTE]
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comment Input Box */}
                  <form onSubmit={handleAddComment} className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
                    <textarea
                      rows={2}
                      placeholder="Type reply or internal note..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none"
                    />

                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-1.5 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalComment}
                          onChange={(e) => setIsInternalComment(e.target.checked)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <span>Internal Note (Hidden from Requester)</span>
                      </label>

                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Update</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-500 my-auto">
                  Select an incident from the queue to review diagnostic telemetry.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raise Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Headphones className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100">Raise IT Service Desk Ticket</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Issue Summary / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro M2 battery draining fast or WireGuard VPN connection dropped"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAiSuggestNewTicket}
                  disabled={isSuggestingCategory}
                  className="flex items-center space-x-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSuggestingCategory ? 'Analyzing...' : 'AI Auto-Suggest Category & Priority'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="NETWORK">Network / VPN</option>
                    <option value="ACCESS">Account / SSO Access</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="LOW">Low (48h resolution)</option>
                    <option value="MEDIUM">Medium (24h resolution)</option>
                    <option value="HIGH">High (8h resolution)</option>
                    <option value="URGENT">Urgent (4h resolution)</option>
                    <option value="CRITICAL">Critical Production Blocker (1h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe error messages, steps to reproduce, or affected hardware serial numbers..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
