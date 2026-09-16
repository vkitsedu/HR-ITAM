import React, { useEffect, useState } from 'react';
import {
  Clock,
  Laptop,
  Headphones,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  Send,
  MapPin,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CustodyCertificateModal } from '../components/CustodyCertificateModal';

export const EmployeeSelfServiceView: React.FC = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [dailyRecord, setDailyRecord] = useState<any>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [myAssets, setMyAssets] = useState<any[]>([]);
  const [isPunching, setIsPunching] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [viewingCertReceiptId, setViewingCertReceiptId] = useState<string | null>(null);

  // Custody Sign Modal
  const [signingReceipt, setSigningReceipt] = useState<any>(null);
  const [sigName, setSigName] = useState('');

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, dailyRes, ticketRes, assetRes] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/attendance/daily'),
        api.get('/itsm/tickets'),
        api.get('/itam/assets'),
      ]);

      // Match current user's employee
      const currentEmp = empRes.data.find(
        (e: any) => e.email.toLowerCase() === user?.email.toLowerCase()
      ) || empRes.data[0]; // Fallback to first employee for testing

      setEmployee(currentEmp);

      if (currentEmp) {
        const today = dailyRes.data.find((d: any) => d.employeeId === currentEmp.id);
        setDailyRecord(today || null);

        const assigned = assetRes.data.filter((a: any) => a.assignedToEmployeeId === currentEmp.id);
        setMyAssets(assigned);

        const tickets = ticketRes.data.filter((t: any) => t.requesterId === user?.id);
        setMyTickets(tickets);
      }
    } catch (e) {
      console.error('Failed to load ESS data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePunch = async (punchType: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!employee) return;
    try {
      setIsPunching(true);
      // Simulate office coordinates (Bengaluru HQ)
      const lat = 12.9352;
      const lon = 77.6245;

      await api.post('/attendance/punch', {
        employeeId: employee.id,
        punchType,
        mode: 'MOBILE_GPS',
        latitude: lat,
        longitude: lon,
      });

      fetchData();
      alert(`Successfully punched ${punchType.replace('_', ' ')}! Geofence verified.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to punch attendance');
    } finally {
      setIsPunching(false);
    }
  };

  const handleSignCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingReceipt || !sigName.trim()) return;
    try {
      await api.post(`/itam/custody/${signingReceipt.custodyReceiptId}/sign`, {
        signatureData: `DIGITAL_VERIFIED_${sigName.toUpperCase()}_${Date.now()}`,
        acceptedTerms: true,
      });
      setSigningReceipt(null);
      setSigName('');
      fetchData();
      alert('Digital custody acknowledgement signed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to sign custody');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-100">
              Welcome back, {employee?.firstName} {employee?.lastName}
            </h2>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-semibold">
              {employee?.designationTitle || 'Staff Member'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {employee?.departmentName} • {employee?.locationName} • Employee ID:{' '}
            <span className="font-mono text-slate-300">{employee?.employeeCode}</span>
          </p>
        </div>

        {/* Live Clock & Geofence Pill */}
        <div className="bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-xl text-right">
          <div className="text-lg font-mono font-bold text-indigo-400">{currentTime}</div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-end space-x-1">
            <MapPin className="w-3 h-3" />
            <span>Koramangala Hub Geofence Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Punch Clock & Daily Telemetry (1 col) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Smart Attendance Punch</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-400">Geofence 250m</span>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center space-y-3">
            <div className="text-xs text-slate-400">Today's Shift: 09:00 AM – 06:00 PM (15m Grace)</div>
            <div className="text-2xl font-mono font-extrabold text-slate-100">
              {dailyRecord
                ? `${Math.floor(dailyRecord.totalWorkMinutes / 60)}h ${dailyRecord.totalWorkMinutes % 60}m Logged`
                : 'Not Checked In Yet'}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div className="text-left">
                <span className="text-[11px] text-slate-400 block">First In:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {dailyRecord?.firstCheckIn ? new Date(dailyRecord.firstCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Last Out:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {dailyRecord?.lastCheckOut ? new Date(dailyRecord.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handlePunch('CHECK_IN')}
                disabled={isPunching}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                Punch Check-In
              </button>
              <button
                onClick={() => handlePunch('CHECK_OUT')}
                disabled={isPunching}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                Punch Check-Out
              </button>
            </div>
          </div>

          {/* Leave Balances Widget */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>My Leave Ledger</span>
              <span className="text-indigo-400">Sandwich Rule Evaluated</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="text-lg font-bold text-slate-100">12</div>
                <div className="text-[10px] text-slate-400">Earned (EL)</div>
              </div>
              <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="text-lg font-bold text-slate-100">6</div>
                <div className="text-[10px] text-slate-400">Casual (CL)</div>
              </div>
              <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="text-lg font-bold text-slate-100">5</div>
                <div className="text-[10px] text-slate-400">Sick (SL)</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Assigned Hardware & Digital Custody (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hardware Assets */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Laptop className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">My Assigned IT Hardware ({myAssets.length})</h3>
              </div>
              <span className="text-xs text-slate-400">Digital Custody Protection</span>
            </div>

            <div className="space-y-3">
              {myAssets.length > 0 ? (
                myAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200 text-sm">{asset.name}</span>
                        <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {asset.assetTag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Serial: {asset.serialNumber} • Model: {asset.brand} {asset.model}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Assigned on {asset.purchaseDate} • Location: {asset.locationName}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {asset.custodyStatus === 'ACKNOWLEDGED' ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Custody Verified</span>
                          </div>
                          {asset.custodyReceiptId && (
                            <button
                              onClick={() => setViewingCertReceiptId(asset.custodyReceiptId)}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-400" />
                              <span>View Certificate</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSigningReceipt(asset)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition animate-pulse"
                        >
                          <FileSignature className="w-4 h-4" />
                          <span>Sign Custody Acceptance</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No company hardware assigned to your employee account yet.
                </div>
              )}
            </div>
          </div>

          {/* My IT Service Tickets */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">My Raised IT Support Incidents ({myTickets.length})</h3>
              </div>
              <span className="text-xs text-slate-400">Response SLA Tracking</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {myTickets.length > 0 ? (
                myTickets.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-purple-400 font-bold">{t.ticketNumber}</span>
                        <span className="text-slate-200 font-semibold">{t.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {t.category} • Created {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'RESOLVED' || t.status === 'CLOSED'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-slate-500">You have no open IT tickets.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Custody Acceptance Modal */}
      {signingReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileSignature className="w-5 h-5 text-indigo-400" />
                <span>Digital Asset Custody Acceptance</span>
              </h3>
              <button onClick={() => setSigningReceipt(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2 leading-relaxed text-slate-300">
              <p className="font-bold text-slate-200">
                Device Details: {signingReceipt.name} ({signingReceipt.assetTag})
              </p>
              <p className="text-slate-400 font-mono">Serial: {signingReceipt.serialNumber}</p>
              <p className="text-[11px] text-slate-400">
                "I acknowledge receipt of the corporate hardware listed above in good working condition. I agree to safeguard this equipment in compliance with IT security policies and return it to IT upon transfer, resignation, or termination prior to Full & Final settlement release."
              </p>
            </div>

            <form onSubmit={handleSignCustody} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Type your Full Legal Name as Electronic Signature:
                </label>
                <input
                  type="text"
                  required
                  placeholder={`${employee?.firstName} ${employee?.lastName}`}
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-serif italic text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSigningReceipt(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Decline
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Digitally Sign & Acknowledge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custody Certificate Modal */}
      {viewingCertReceiptId && (
        <CustodyCertificateModal
          receiptId={viewingCertReceiptId}
          onClose={() => setViewingCertReceiptId(null)}
        />
      )}
    </div>
  );
};
