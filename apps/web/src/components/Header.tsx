import React, { useEffect, useState } from 'react';
import {
  Shield,
  Sparkles,
  RefreshCw,
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenWizard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRefresh, isRefreshing, onOpenWizard }) => {
  const { user, login } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifs(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  const handleQuickSwitch = async (email: string) => {
    try {
      await login(email, 'Password123!');
    } catch (e) {
      console.error('Quick switch failed:', e);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <span>{title}</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-4">
        {/* Quick Demo Role Switcher */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-950/60 border border-slate-800 px-2 py-1 rounded-lg text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center">
            <Sparkles className="w-3 h-3 text-indigo-400 mr-1" />
            Switch View:
          </span>
          <button
            onClick={() => handleQuickSwitch('hr@acme.com')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              user?.role === 'HR_MANAGER'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            HR Lead
          </button>
          <button
            onClick={() => handleQuickSwitch('it@acme.com')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              user?.role === 'IT_MANAGER'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            IT Manager
          </button>
          <button
            onClick={() => handleQuickSwitch('tech@acme.com')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              user?.role === 'IT_TECHNICIAN'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            IT Tech
          </button>
          <button
            onClick={() => handleQuickSwitch('employee@acme.com')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              user?.role === 'EMPLOYEE'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Employee
          </button>
        </div>

        {/* Customize Workspace / Welcome Wizard Launcher */}
        {onOpenWizard && (
          <button
            onClick={onOpenWizard}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/25 to-purple-600/25 hover:from-indigo-600/40 hover:to-purple-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-semibold shadow-sm transition"
            title="Configure Industry Template, UI Themes & Catalog"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Welcome Wizard</span>
          </button>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        )}

        {/* Notification Bell & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPopover(!showNotifPopover)}
            className="relative p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifPopover && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-slate-100">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifPopover(false)}
                    className="text-slate-400 hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {isLoadingNotifs && notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading alerts...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="font-medium text-slate-300">All caught up!</p>
                    <p className="text-[11px]">No active notifications or pending SLA alerts.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={(e) => handleMarkRead(n.id, e)}
                      className={`p-3.5 hover:bg-slate-800/40 transition cursor-pointer flex items-start space-x-3 ${
                        !n.isRead ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'ALERT' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        ) : n.type === 'WARNING' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : n.type === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Info className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold truncate ${!n.isRead ? 'text-slate-100 font-bold' : 'text-slate-300'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono pt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RLS Security Status Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[11px] font-semibold">
          <Shield className="w-3 h-3" />
          <span>Tenant Isolated</span>
        </div>
      </div>
    </header>
  );
};
