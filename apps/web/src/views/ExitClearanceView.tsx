import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Laptop,
  ArrowRight,
  Building,
  DollarSign,
  Printer,
  Award,
  FileCheck,
} from 'lucide-react';
import { api } from '../api';
import { ItNocCertificateModal } from '../components/ItNocCertificateModal';

export const ExitClearanceView: React.FC = () => {
  const [clearances, setClearances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingNocClearanceId, setViewingNocClearanceId] = useState<string | null>(null);

  const fetchClearances = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/itam/exit-clearances');
      setClearances(res.data);
    } catch (e) {
      console.error('Failed to load exit clearances:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClearances();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Exit Clearance & Full & Final (F&F) Settlement</h2>
            <p className="text-xs text-slate-400">
              Cross-Departmental Governance: IT Hardware Recovery $\rightarrow$ IT NOC $\rightarrow$ HR F&F Payroll Release
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold rounded-full">
          Zero Ghost Asset Loss
        </span>
      </div>

      {/* Governance Explainer Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm text-xs space-y-3">
        <h3 className="font-bold text-slate-200 flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Automated IT NOC Settlement Gate</span>
        </h3>
        <p className="text-slate-400 leading-relaxed">
          In disconnected software stacks, departing employees often keep company laptops while HR processes final payroll settlements due to lack of visibility. EmpOps locks the Full & Final settlement pipeline: HR cannot finalize final dues until IT receives, tests, and checks-in every assigned device. Once the last asset is verified in ITAM, an electronic IT NOC is cryptographically stamped into the employee's audit trail.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>1. IT Asset Recovery Gate</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>2. Automated IT NOC Generation</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>3. HR & Finance Payroll Clearance</span>
          </div>
        </div>
      </div>

      {/* Clearances Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200">Active Exit Clearances ({clearances.length})</h3>
          <span className="text-[11px] text-slate-400 font-medium">Real-Time Custody Audit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Notice Timeline</th>
                <th className="px-5 py-3">Pending IT Hardware</th>
                <th className="px-5 py-3">IT NOC Status</th>
                <th className="px-5 py-3 text-right">F&F Settlement State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clearances.length > 0 ? (
                clearances.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-200">{c.employeeName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.employeeCode}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">{c.departmentName}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-300 text-[11px]">
                      Resigned: {c.resignationDate} <br />
                      LWD: {c.lastWorkingDay}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.pendingAssets?.length > 0 ? (
                        <div className="space-y-1">
                          {c.pendingAssets.map((a: any) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[10px] font-mono mr-1"
                            >
                              <Laptop className="w-3 h-3 text-rose-400" />
                              <span>
                                {a.name} ({a.assetTag})
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400 font-semibold text-[11px] flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          All hardware recovered
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.itNocIssued ? (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-md font-bold text-[10px] inline-flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            IT NOC ISSUED
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {new Date(c.itNocIssuedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-md font-bold text-[10px] inline-flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            HOLD (Assets Due: {c.pendingAssetCount})
                          </span>
                          <p className="text-[10px] text-slate-400">Blocked by IT custody</p>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {c.itNocIssued ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded font-bold text-[10px]">
                            Payroll Unlocked
                          </span>
                          <button
                            onClick={() => setViewingNocClearanceId(c.id)}
                            className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] shadow-sm transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print IT NOC</span>
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded font-bold text-[11px]">
                          F&F Locked
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No employees currently in exit clearance / notice period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official IT NOC Certificate Modal */}
      {viewingNocClearanceId && (
        <ItNocCertificateModal
          clearanceId={viewingNocClearanceId}
          onClose={() => setViewingNocClearanceId(null)}
        />
      )}
    </div>
  );
};
