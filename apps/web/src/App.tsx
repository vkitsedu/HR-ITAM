import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ExecutiveDashboardView } from './views/ExecutiveDashboardView';
import { ItDashboardView } from './views/ItDashboardView';
import { HrDashboardView } from './views/HrDashboardView';
import { HrOperationsView } from './views/HrOperationsView';
import { AttendanceView } from './views/AttendanceView';
import { ItsmView } from './views/ItsmView';
import { ItamView } from './views/ItamView';
import { ItamInventoryReportView } from './views/ItamInventoryReportView';
import { NocObservabilityView } from './views/NocObservabilityView';
import { ExitClearanceView } from './views/ExitClearanceView';
import { EmployeeSelfServiceView } from './views/EmployeeSelfServiceView';
import { AuditTrailView } from './views/AuditTrailView';
import { LoginView } from './views/LoginView';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';

const getDefaultTabForRole = (role?: string): NavTab => {
  switch (role) {
    case 'IT_MANAGER':
      return 'it-dashboard';
    case 'IT_TECHNICIAN':
      return 'itsm';
    case 'HR_MANAGER':
      return 'hr-dashboard';
    case 'EMPLOYEE':
      return 'ess';
    case 'TENANT_ADMIN':
    case 'SUPER_ADMIN':
    default:
      return 'executive';
  }
};

const isTabAllowedForRole = (tab: NavTab, role?: string): boolean => {
  switch (role) {
    case 'IT_MANAGER':
      return ['it-dashboard', 'noc-observability', 'itam', 'itam-stock', 'itsm', 'clearance', 'audit'].includes(tab);
    case 'IT_TECHNICIAN':
      return ['itsm', 'itam', 'clearance', 'ess'].includes(tab);
    case 'HR_MANAGER':
      return ['hr-dashboard', 'hr', 'attendance', 'clearance', 'audit'].includes(tab);
    case 'EMPLOYEE':
      return tab === 'ess';
    case 'TENANT_ADMIN':
    case 'SUPER_ADMIN':
    default:
      return true;
  }
};

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>(() => getDefaultTabForRole(user?.role));
  const [navigationFilter, setNavigationFilter] = useState<{ status?: string; category?: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleNavigateTab = (tab: NavTab, filter?: { status?: string; category?: string }) => {
    setNavigationFilter(filter || null);
    setActiveTab(tab);
  };

  // Automatically update active tab when user role changes (e.g. quick demo switch in header)
  useEffect(() => {
    if (user) {
      setActiveTab(getDefaultTabForRole(user.role));
      setNavigationFilter(null);
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading EmpOps Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'it-dashboard':
        return {
          title: 'IT Operations Command Center',
          subtitle: 'Fleet Health, Incident SLAs, Onboarding Hardware Demand & Asset Recovery Gate',
        };
      case 'noc-observability':
        return {
          title: 'IT Operations NOC & Grafana Telemetry Studio',
          subtitle: 'Real-time Time-Series Metrics, Safety Stock Depletion Velocity & Turnkey Grafana Observability',
        };
      case 'hr-dashboard':
        return {
          title: 'Workforce & People Operations Center',
          subtitle: 'Headcount Pulse, Live Attendance, Form 25 Muster Roll & Exit Clearances',
        };
      case 'itam-stock':
        return {
          title: 'IT Inventory & Stock Telemetry',
          subtitle: 'Safety Buffers, Reorder Alerts, Onboarding Demand & Straight-Line Asset Depreciation',
        };
      case 'executive':
        return {
          title: 'Executive Pulse & Cross-Domain Operations',
          subtitle: 'Real-time telemetry across Workforce, SLAs, Fleet Valuation & Settlement Risk',
        };
      case 'ess':
        return {
          title: 'Employee Self-Service (ESS)',
          subtitle: 'Daily Geofenced Clock-In, My Assigned Hardware & IT Support Tickets',
        };
      case 'hr':
        return {
          title: 'Human Resources & Workforce Directory',
          subtitle: 'Employee Master, Automated IT Provisioning & Form 25 Monthly Muster Roll',
        };
      case 'attendance':
        return {
          title: 'Smart Attendance & Leave Management',
          subtitle: 'Geofenced GPS Ingestion, Shift Grace Windows & Multi-Tier Leave Approvals',
        };
      case 'itsm':
        return {
          title: 'IT Service Management (ITSM)',
          subtitle: 'ITIL Service Desk, Incident Categorization & Business-Hours SLA Engine',
        };
      case 'itam':
        return {
          title: 'IT Asset & Hardware Lifecycle Management',
          subtitle: 'Procurement to Retirement, QR Serialization & Digital In-App Sign-Off',
        };
      case 'clearance':
        return {
          title: 'Offboarding Governance & Full and Final (F&F) Settlement',
          subtitle: 'IT Asset Handover Verification & Automated Electronic IT NOC Release Gate',
        };
      case 'audit':
        return {
          title: 'Immutable System Audit Trail & Event Forensics',
          subtitle: 'CERT-In, ISO 27001 & SOC 2 Non-Repudiable Event Logs Across HR, ITAM & ITSM',
        };
    }
  };

  const { title, subtitle } = getHeaderMeta();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          onOpenWizard={() => setIsWizardOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-950" key={refreshKey}>
          {activeTab === 'it-dashboard' && <ItDashboardView onNavigateTab={handleNavigateTab} />}
          {activeTab === 'noc-observability' && <NocObservabilityView />}
          {activeTab === 'hr-dashboard' && <HrDashboardView onNavigateTab={handleNavigateTab} />}
          {activeTab === 'itam-stock' && (
            <ItamInventoryReportView initialCategoryFilter={navigationFilter?.category} />
          )}
          {activeTab === 'executive' && <ExecutiveDashboardView onNavigateTab={handleNavigateTab} />}
          {activeTab === 'ess' && <EmployeeSelfServiceView />}
          {activeTab === 'hr' && <HrOperationsView />}
          {activeTab === 'attendance' && <AttendanceView />}
          {activeTab === 'itsm' && <ItsmView />}
          {activeTab === 'itam' && (
            <ItamView
              onNavigateStock={() => handleNavigateTab('itam-stock')}
              initialStatusFilter={navigationFilter?.status}
            />
          )}
          {activeTab === 'clearance' && <ExitClearanceView />}
          {activeTab === 'audit' && <AuditTrailView />}
        </main>
      </div>

      {/* Onboarding Welcome & Customization Wizard */}
      <OnboardingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onApplied={() => {
          setIsWizardOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
