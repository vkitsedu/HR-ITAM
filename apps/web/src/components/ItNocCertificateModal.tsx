import React, { useEffect, useState } from 'react';
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  X,
  Laptop,
  Building,
  Award,
} from 'lucide-react';
import { api } from '../api';

interface ItNocCertificateModalProps {
  clearanceId: string;
  onClose: () => void;
}

export const ItNocCertificateModal: React.FC<ItNocCertificateModalProps> = ({
  clearanceId,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNoc = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/itam/exit-clearances/${clearanceId}/certificate`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load IT NOC certificate:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNoc();
  }, [clearanceId]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8">
        {/* Top Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Electronic IT Clearance & No-Objection Certificate (NOC)</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {data ? data.nocCertificateNumber : 'Generating clearance certificate...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={isLoading || !data}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Compiling asset recovery logs and generating certified IT NOC...</p>
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-rose-400 text-xs">Failed to load IT NOC data.</div>
        ) : (
          <div
            id="print-it-noc"
            className="bg-white text-slate-950 p-8 rounded-xl border-2 border-slate-900 shadow-inner font-sans space-y-6 relative overflow-hidden"
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-9xl font-black text-slate-900 rotate-[-25deg]">
              NOC CLEARED
            </div>

            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-black tracking-tight uppercase text-slate-950">
                  {data.organization.legalName}
                </h1>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Department of Information Technology & Enterprise Security
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  CIN/GSTIN: {data.organization.cinOrGstin} • Facility: {data.organization.facility}
                </p>
              </div>
              <div className="text-right space-y-1 font-mono">
                <div className="inline-block px-2.5 py-1 bg-emerald-50 border-2 border-emerald-700 rounded font-black text-xs text-emerald-800">
                  {data.nocCertificateNumber}
                </div>
                <p className="text-[10px] text-slate-500">
                  Issued: {new Date(data.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 underline decoration-emerald-600 decoration-2 underline-offset-4">
                Electronic IT Clearance & No-Objection Certificate (NOC)
              </h2>
              <p className="text-[11px] text-slate-600">
                Official statutory clearance for Full & Final (F&F) settlement and payroll release
              </p>
            </div>

            {/* Employee Separation Details */}
            <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 rounded-lg p-4 bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-medium">Employee Name:</span>
                  <span className="font-bold text-slate-900">{data.employee.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-medium">Employee Code:</span>
                  <span className="font-mono font-bold text-slate-900">{data.employee.code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="font-medium text-slate-800">{data.employee.department}</span>
                </div>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-medium font-sans">Resignation Date:</span>
                  <span className="font-bold text-slate-800">{data.resignationDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-medium font-sans">Last Working Day:</span>
                  <span className="font-bold text-slate-800">{data.lastWorkingDay}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-medium font-sans">Clearance State:</span>
                  <span className="font-bold text-emerald-700">CLEARED & APPROVED</span>
                </div>
              </div>
            </div>

            {/* Hardware Recovery Audit Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Audit of Recovered Hardware Assets & Credentials
              </h4>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Asset Tag</th>
                      <th className="p-2.5">Device Description</th>
                      <th className="p-2.5">Serial Number</th>
                      <th className="p-2.5">Returned Date</th>
                      <th className="p-2.5 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {data.returnedAssets?.length > 0 ? (
                      data.returnedAssets.map((asset: any, idx: number) => (
                        <tr key={idx} className="bg-white">
                          <td className="p-2.5 font-mono font-bold text-indigo-700">{asset.tag}</td>
                          <td className="p-2.5 font-semibold text-slate-900">{asset.name}</td>
                          <td className="p-2.5 font-mono text-slate-600">{asset.serialNumber}</td>
                          <td className="p-2.5 font-mono text-slate-600">{asset.returnedAt}</td>
                          <td className="p-2.5 text-right text-emerald-700 font-bold">
                            ✓ Verified by {asset.verifiedBy}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-500 text-[11px]">
                          No hardware assets were allocated to this employee profile.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Clearance Statement */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-lg text-emerald-950 text-xs space-y-1">
              <p className="font-bold text-[11px] uppercase tracking-wide text-emerald-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>IT Infrastructure Clearance & Payroll Release Authorization</span>
              </p>
              <p className="text-[10.5px] leading-relaxed text-slate-700">
                {data.clearanceStatement}
              </p>
            </div>

            {/* Signature & Seal Block */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t-2 border-slate-900 items-end">
              <div className="col-span-2 space-y-2">
                <div className="border-2 border-dashed border-emerald-600 bg-emerald-50/40 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-emerald-800 tracking-wider uppercase">
                      ELECTRONIC IT NOC GRANTED
                    </p>
                    <p className="text-[9px] font-mono text-slate-600">
                      Authorized by: IT Asset Operations / ITIL Desk Manager
                    </p>
                    <p className="text-[8.5px] font-mono text-slate-500">
                      Clearance Timestamp: {new Date(data.issuedAt).toUTCString()}
                    </p>
                  </div>
                  <ShieldCheck className="w-10 h-10 text-emerald-600" />
                </div>
              </div>

              {/* QR Verification Seal */}
              <div className="text-center space-y-1">
                <div className="w-20 h-20 bg-slate-950 p-1.5 rounded-lg flex items-center justify-center mx-auto shadow-md">
                  <div className="w-full h-full bg-white p-1 rounded-sm grid grid-cols-5 gap-0.5">
                    <div className="bg-slate-950 col-span-2 row-span-2 rounded-[1px]"></div>
                    <div className="bg-slate-950"></div>
                    <div className="bg-slate-950 col-span-2 row-span-2 rounded-[1px]"></div>
                    <div className="bg-slate-950"></div>
                    <div className="bg-slate-950"></div>
                    <div className="bg-slate-950 col-span-2 row-span-2 rounded-[1px]"></div>
                    <div className="bg-slate-950"></div>
                    <div className="bg-slate-950"></div>
                    <div className="bg-slate-950 col-span-2"></div>
                  </div>
                </div>
                <p className="text-[8px] font-mono text-slate-500">Scan to Verify NOC</p>
              </div>
            </div>

            {/* Cryptographic SHA-256 Hash */}
            <div className="pt-2 border-t border-slate-200 text-center font-mono text-[8px] text-slate-500">
              <span>SHA-256 INTEGRITY HASH: </span>
              <span className="font-bold text-slate-700">{data.verificationHash}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
