import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Laptop,
  Ticket,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { api } from '../api';

interface AuditLogItem {
  id: string;
  tenantId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 100 };
      if (filterEntity) params.entityType = filterEntity;
      if (filterAction) params.action = filterAction;

      const res = await api.get('/audit/logs', { params });
      setLogs(res.data.logs || []);
      setTotalCount(res.data.total || 0);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterEntity, filterAction]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (action.includes('ASSIGNED')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    if (action.includes('AUDITED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (action.includes('ACKNOWLEDGED')) return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    if (action.includes('RETURNED')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (action.includes('NOC')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (action.includes('RESIGNATION')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Asset':
        return <Laptop className="w-3.5 h-3.5 text-blue-400" />;
      case 'Ticket':
        return <Ticket className="w-3.5 h-3.5 text-amber-400" />;
      case 'Employee':
        return <User className="w-3.5 h-3.5 text-emerald-400" />;
      case 'CustodyReceipt':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ExitClearance':
        return <Shield className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q) ||
      (log.entityId && log.entityId.toLowerCase().includes(q)) ||
      log.userName.toLowerCase().includes(q) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Immutable System Audit Trail</span>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
                CERT-In & ISO 27001 Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Chronological, non-repudiable audit events for asset provisioning, custody sign-offs, ticket lifecycle and F&F clearances.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh Audit Feed</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by action, actor, entity ID or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Entity:</span>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Entities</option>
              <option value="Asset">Asset</option>
              <option value="CustodyReceipt">Custody Receipt</option>
              <option value="Ticket">Ticket</option>
              <option value="Employee">Employee</option>
              <option value="ExitClearance">Exit Clearance</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium">Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Actions</option>
              <option value="ASSET_CREATED">Asset Created</option>
              <option value="ASSET_ASSIGNED">Asset Assigned</option>
              <option value="ASSET_AUDITED">Asset Audited</option>
              <option value="CUSTODY_ACKNOWLEDGED">Custody Signed</option>
              <option value="ASSET_RETURNED">Asset Returned</option>
              <option value="IT_NOC_ISSUED">IT NOC Issued</option>
              <option value="TICKET_CREATED">Ticket Created</option>
              <option value="RESIGNATION_FILED">Resignation Filed</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono pl-2 border-l border-slate-800">
            {filteredLogs.length} events
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3 w-12 text-center"></th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Target Entity</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Details / Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit events...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  let parsedDetails: any = null;
                  try {
                    parsedDetails = log.details ? JSON.parse(log.details) : null;
                  } catch {
                    parsedDetails = log.details;
                  }

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className={`hover:bg-slate-800/30 transition cursor-pointer ${
                          isExpanded ? 'bg-slate-800/20' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5 text-center text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-400 mx-auto" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 mx-auto" />
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 text-slate-300 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{new Date(log.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'medium',
                            })}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            {getEntityIcon(log.entityType)}
                            <span className="font-semibold text-slate-200">{log.entityType}</span>
                            {log.entityId && (
                              <span className="text-slate-400 font-mono text-[11px]">
                                ({log.entityId})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-slate-200">{log.userName}</p>
                            {log.userEmail && (
                              <p className="text-[11px] text-slate-400 font-mono">{log.userEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 max-w-md">
                          <p className="text-slate-300 truncate font-mono text-[11px]">
                            {typeof parsedDetails === 'object' && parsedDetails !== null
                              ? Object.entries(parsedDetails)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' | ')
                              : String(log.details || '—')}
                          </p>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-slate-800">
                          <td colSpan={6} className="px-8 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                <span>Event ID: <span className="text-slate-300">{log.id}</span></span>
                                <span>Tenant ID: <span className="text-slate-300">{log.tenantId}</span></span>
                              </div>
                              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-x-auto">
                                <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
                                  {JSON.stringify(parsedDetails, null, 2)}
                                </pre>
                              </div>
                            </div>
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
      </div>
    </div>
  );
};
