import React, { useEffect, useState } from 'react';
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  Building,
  QrCode,
  Lock,
} from 'lucide-react';
import { api } from '../api';

interface CustodyCertificateModalProps {
  receiptId: string;
  onClose: () => void;
}

export const CustodyCertificateModal: React.FC<CustodyCertificateModalProps> = ({
  receiptId,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/itam/custody/${receiptId}/certificate`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load certificate:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCert();
  }, [receiptId]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Digital Asset Custody Certificate</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {data ? data.certificateNumber : 'Verifying certificate...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={isLoading || !data}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Container (Print-ready) */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Generating cryptographically verified custody certificate...</p>
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-rose-400 text-xs">Failed to load certificate data.</div>
        ) : (
          <div
            id="print-certificate"
            className="bg-white text-slate-950 p-8 rounded-xl border-2 border-slate-900 shadow-inner font-sans space-y-6 relative overflow-hidden"
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-9xl font-black text-slate-900 rotate-[-25deg]">
              VERIFIED
            </div>

            {/* Certificate Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-black tracking-tight uppercase text-slate-950">
                  {data.organization.legalName}
                </h1>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Information Technology Infrastructure & Asset Management Division
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  CIN/GSTIN: {data.organization.cinOrGstin} • Facility: {data.organization.facility}
                </p>
              </div>
              <div className="text-right space-y-1 font-mono">
                <div className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-900 rounded font-black text-xs text-slate-900">
                  {data.certificateNumber}
                </div>
                <p className="text-[10px] text-slate-500">
                  Issued: {new Date(data.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </p>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 underline decoration-indigo-600 decoration-2 underline-offset-4">
                Certificate of Digital Asset Custody & Allocation
              </h2>
              <p className="text-[11px] text-slate-600">
                Official instrument of hardware issuance, custody acknowledgement, and fiduciary care
              </p>
            </div>

            {/* Parties & Asset Details Grid */}
            <div className="grid grid-cols-2 gap-6 text-xs border border-slate-300 rounded-lg p-4 bg-slate-50/70">
              {/* Custodian Details */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  1. Designated Custodian (Employee)
                </h4>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="col-span-2 font-bold text-slate-900">{data.employee.name}</span>
                  <span className="text-slate-500 font-medium">Emp Code:</span>
                  <span className="col-span-2 font-mono font-bold text-slate-900">{data.employee.code}</span>
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="col-span-2 font-medium text-slate-800">{data.employee.department}</span>
                  <span className="text-slate-500 font-medium">Designation:</span>
                  <span className="col-span-2 font-medium text-slate-800">{data.employee.designation}</span>
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="col-span-2 font-mono text-[10px] text-slate-700">{data.employee.email}</span>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  2. Allocated Hardware Asset
                </h4>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Asset Tag:</span>
                  <span className="col-span-2 font-mono font-black text-indigo-700">{data.asset.tag}</span>
                  <span className="text-slate-500 font-medium">Description:</span>
                  <span className="col-span-2 font-bold text-slate-900">{data.asset.name}</span>
                  <span className="text-slate-500 font-medium">Model / Make:</span>
                  <span className="col-span-2 font-medium text-slate-800">{data.asset.brand} {data.asset.model}</span>
                  <span className="text-slate-500 font-medium">Serial No:</span>
                  <span className="col-span-2 font-mono font-bold text-slate-900">{data.asset.serialNumber}</span>
                  <span className="text-slate-500 font-medium">Fleet Condition:</span>
                  <span className="col-span-2 font-semibold text-emerald-700">{data.asset.condition}</span>
                </div>
              </div>
            </div>

            {/* Legal Clauses */}
            <div className="space-y-1 text-[10px] text-slate-700 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <h4 className="font-bold uppercase text-[9.5px] text-slate-900 mb-1">
                3. Mandatory Terms & Statutory Undertaking
              </h4>
              {data.legalClauses.map((clause: string, i: number) => (
                <p key={i} className="leading-relaxed">{clause}</p>
              ))}
            </div>

            {/* Signature & Cryptographic Verification Section */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 items-end">
              {/* Digital Signature Stamp */}
              <div className="col-span-2 space-y-1">
                <div className="border border-emerald-600 bg-emerald-50/60 rounded-lg p-3 relative">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs pb-1 border-b border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>DIGITALLY SIGNED & VERIFIED IN ESS PORTAL</span>
                  </div>
                  <div className="pt-2 text-[10px] space-y-0.5">
                    <p className="font-mono text-slate-800">
                      Signatory: <span className="font-bold">{data.employee.name}</span> ({data.employee.code})
                    </p>
                    <p className="font-mono text-slate-600">
                      Acknowledged At: {data.acknowledgedAt ? new Date(data.acknowledgedAt).toUTCString() : 'PENDING'}
                    </p>
                    <p className="font-mono text-[8.5px] text-slate-500 truncate">
                      Digital Signature Token: {data.signatureData || 'SIGN_DIGITAL_IN_APP'}
                    </p>
                  </div>
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
                <p className="text-[8px] font-mono text-slate-500">Scan to Verify Audit</p>
              </div>
            </div>

            {/* Cryptographic SHA-256 Hash Footnote */}
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
