import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Headphones,
  Laptop,
  Boxes,
  ShieldCheck,
  Building2,
  LogOut,
  UserCircle,
  FileText,
  Briefcase,
  Shield,
  Layers,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab =
  | 'executive'
  | 'it-dashboard'
  | 'noc-observability'
  | 'hr-dashboard'
  | 'ess'
  | 'hr'
  | 'attendance'
  | 'itsm'
  | 'itam'
  | 'itam-stock'
  | 'clearance'
  | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: any;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'EMPLOYEE';

  // Role-Based Navigation Items
  const getNavSections = (): { title: string; items: NavItem[] }[] => {
    switch (role) {
      case 'IT_MANAGER':
        return [
          {
            title: 'IT Command & Operations',
            items: [
              { id: 'it-dashboard', label: 'IT Operations Pulse', icon: LayoutDashboard, badge: 'NOC' },
              { id: 'noc-observability', label: 'Grafana & NOC Studio', icon: Activity, badge: 'Prom' },
              { id: 'itam', label: 'Hardware Fleet', icon: Laptop },
              { id: 'itam-stock', label: 'Inventory & Stock Reports', icon: Boxes, badge: 'Live' },
              { id: 'itsm', label: 'IT Service Desk', icon: Headphones, badge: 'ITIL' },
            ],
          },
          {
            title: 'Governance & Asset Recovery',
            items: [
              { id: 'clearance', label: 'Exit Hardware Clearance', icon: ShieldCheck, badge: 'NOC' },
              { id: 'audit', label: 'IT Security Audit Trail', icon: FileText, badge: 'SOC2' },
            ],
          },
        ];

      case 'IT_TECHNICIAN':
        return [
          {
            title: 'Technician Workbench',
            items: [
              { id: 'itsm', label: 'Incident Desk & Queue', icon: Headphones, badge: 'SLA' },
              { id: 'itam', label: 'Asset Inspection & Tagging', icon: Laptop },
              { id: 'clearance', label: 'Device Check-in / Return', icon: ShieldCheck },
              { id: 'ess', label: 'My Self-Service', icon: UserCircle },
            ],
          },
        ];

      case 'HR_MANAGER':
        return [
          {
            title: 'People Operations',
            items: [
              { id: 'hr-dashboard', label: 'Workforce Pulse', icon: LayoutDashboard, badge: 'Live' },
              { id: 'hr', label: 'Employee Directory', icon: Users },
              { id: 'attendance', label: 'Attendance & Muster Roll', icon: Clock, badge: 'Form 25' },
            ],
          },
          {
            title: 'Governance & Compliance',
            items: [
              { id: 'clearance', label: 'Exit & F&F Settlements', icon: ShieldCheck, badge: 'Gate' },
              { id: 'audit', label: 'Compliance Audit Trail', icon: FileText, badge: 'SOC2' },
            ],
          },
        ];

      case 'EMPLOYEE':
        return [
          {
            title: 'Self-Service Portal',
            items: [
              { id: 'ess', label: 'My Workplace Workbench', icon: UserCircle, badge: 'Home' },
            ],
          },
        ];

      case 'TENANT_ADMIN':
      case 'SUPER_ADMIN':
      default:
        return [
          {
            title: 'Executive Suite',
            items: [
              { id: 'executive', label: 'Executive Command Pulse', icon: LayoutDashboard, badge: '360°' },
            ],
          },
          {
            title: 'IT Operations & Fleet',
            items: [
              { id: 'it-dashboard', label: 'IT Operations Pulse', icon: Layers },
              { id: 'noc-observability', label: 'Grafana & NOC Studio', icon: Activity, badge: 'Prom' },
              { id: 'itam', label: 'Hardware Assets', icon: Laptop },
              { id: 'itam-stock', label: 'Inventory & Stock Reports', icon: Boxes },
              { id: 'itsm', label: 'IT Service Desk', icon: Headphones, badge: 'SLA' },
            ],
          },
          {
            title: 'People & Workforce',
            items: [
              { id: 'hr-dashboard', label: 'Workforce Pulse', icon: Users },
              { id: 'hr', label: 'Employee Directory', icon: Users },
              { id: 'attendance', label: 'Smart Attendance', icon: Clock },
              { id: 'clearance', label: 'Exit & F&F Clearances', icon: ShieldCheck },
            ],
          },
          {
            title: 'Forensics & Audit',
            items: [
              { id: 'audit', label: 'Immutable Audit Trail', icon: FileText, badge: 'SOC2' },
            ],
          },
        ];
    }
  };

  const getWorkspaceTitle = () => {
    switch (role) {
      case 'IT_MANAGER':
        return 'IT Operations Workspace';
      case 'IT_TECHNICIAN':
        return 'Technician Workbench';
      case 'HR_MANAGER':
        return 'People Operations Workspace';
      case 'EMPLOYEE':
        return 'Employee Self-Service Portal';
      case 'TENANT_ADMIN':
      case 'SUPER_ADMIN':
      default:
        return 'Enterprise Suite Console';
    }
  };

  const navSections = getNavSections();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-white text-base tracking-tight">
            EO
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm leading-tight tracking-tight">EmpOps</h1>
            <p className="text-[10px] font-medium text-slate-400">Workforce & IT Operations</p>
          </div>
        </div>
      </div>

      {/* Role & Workspace Indicator */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/60 space-y-1">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-indigo-400 truncate">
          <Briefcase className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{getWorkspaceTitle()}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 truncate">
          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{user?.tenantName || 'ACME Technologies India'}</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                        isActive
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] font-semibold text-indigo-400 truncate">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
