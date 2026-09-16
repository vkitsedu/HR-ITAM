import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Camera,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Smartphone,
  Box,
  RefreshCw,
  Upload,
  ShieldCheck,
  Barcode,
  QrCode,
  Sparkles,
  User,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../api';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetSelected?: (asset: any) => void;
  mode?: 'audit_lookup' | 'select_serial';
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onAssetSelected,
  mode = 'audit_lookup',
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<any | null>(null);
  const [auditSuccess, setAuditSuccess] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Available sample barcodes for testing
  const sampleTags = [
    { tag: 'AST-SCN-00112', label: 'AST-SCN-00112 (Scanner)' },
    { tag: 'AST-LAP-00101', label: 'AST-LAP-00101 (MacBook)' },
    { tag: 'AST-MOB-00102', label: 'AST-MOB-00102 (iPhone)' },
    { tag: 'AST-MON-00103', label: 'AST-MON-00103 (Dell 4K)' },
  ];

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const startScanner = async () => {
      try {
        setCameraError(null);
        // Small delay to ensure modal DOM is mounted
        await new Promise((r) => setTimeout(r, 300));
        if (!isMounted) return;

        const readerElement = document.getElementById('camera-reader-element');
        if (!readerElement) return;

        const html5QrCode = new Html5Qrcode('camera-reader-element');
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 180 },
          },
          (decodedText) => {
            if (isMounted) {
              handleBarcodeDetected(decodedText);
            }
          },
          () => {
            // Frame parsing non-match ignored
          }
        );

        if (isMounted) {
          setScannerActive(true);
        }
      } catch (err: any) {
        console.warn('Camera access unavailable or denied:', err);
        if (isMounted) {
          setCameraError(
            err?.message || 'Camera not available or permission denied. Use the virtual simulator or manual barcode entry below.'
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              html5QrCodeRef.current?.clear();
            } catch (e) {}
          });
      }
    };
  }, [isOpen]);

  const handleBarcodeDetected = async (rawCode: string) => {
    const cleaned = rawCode.trim();
    if (!cleaned) return;

    // Pause camera scanning during lookup
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.pause(true);
      } catch (e) {}
    }

    await executeLookup(cleaned);
  };

  const executeLookup = async (query: string) => {
    setIsSearching(true);
    setAuditSuccess(false);
    try {
      const res = await api.get(`/itam/assets/lookup/${encodeURIComponent(query)}`);
      setScannedAsset(res.data);
      if (mode === 'select_serial' && onAssetSelected) {
        onAssetSelected(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || `No asset found with barcode/serial "${query}".`);
      resumeScanner();
    } finally {
      setIsSearching(false);
    }
  };

  const resumeScanner = () => {
    setScannedAsset(null);
    setAuditSuccess(false);
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.resume();
      } catch (e) {}
    }
  };

  const handleVerifyAudit = async () => {
    if (!scannedAsset) return;
    setIsAuditing(true);
    try {
      const res = await api.post(`/itam/assets/${scannedAsset.id}/audit`, {
        notes: 'Physical barcode verification verified via Web Camera Scanner',
      });
      setAuditSuccess(true);
      setScannedAsset({
        ...scannedAsset,
        lastAuditedAt: res.data.asset.lastAuditedAt,
        lastAuditedBy: res.data.asset.lastAuditedBy,
      });
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to record physical audit');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSearching(true);
      const html5QrCode = new Html5Qrcode('file-scanner-element');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleBarcodeDetected(decodedText);
    } catch (err) {
      alert('Could not decode a valid barcode or QR code from the selected image file.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Physical Barcode & QR Scanner</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold">
                  Live Viewfinder
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Point device camera at asset label for instant physical audit & custody verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!scannedAsset ? (
            <>
              {/* Camera Scanner Viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-700/80 aspect-[16/9] flex items-center justify-center">
                {/* HTML5 QR Code Container */}
                <div id="camera-reader-element" className="w-full h-full" />

                {/* Laser Overlay Animation when scanning */}
                {scannerActive && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                    {/* Viewfinder corner brackets */}
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-indigo-400" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-indigo-400" />
                    </div>
                    {/* Scanning Laser Beam */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-[0_0_12px_#10b981]" />
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-indigo-400" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-indigo-400" />
                    </div>
                  </div>
                )}

                {/* Camera fallback / Error message */}
                {cameraError && (
                  <div className="p-6 text-center space-y-2 max-w-sm">
                    <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-xs font-semibold text-amber-400">Webcam Feed Inactive</p>
                    <p className="text-[11px] text-slate-400">
                      Camera permission not granted or device lacks camera. You can still test with the virtual simulator below.
                    </p>
                  </div>
                )}

                {isSearching && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-xs space-x-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-200 font-semibold">Querying ITAM Database...</span>
                  </div>
                )}
              </div>

              {/* Hidden Element for File Scanning */}
              <div id="file-scanner-element" className="hidden" />

              {/* Quick Barcode Simulator & File Upload */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Quick Test Barcode Simulator</span>
                  </span>
                  <label className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center space-x-1 font-semibold">
                    <Upload className="w-3 h-3" />
                    <span>Upload Image Tag</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sampleTags.map((sample) => (
                    <button
                      key={sample.tag}
                      onClick={() => executeLookup(sample.tag)}
                      className="px-2.5 py-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition group"
                    >
                      <span className="text-[10px] text-slate-400 block group-hover:text-indigo-300 font-mono">
                        {sample.tag}
                      </span>
                      <span className="text-[11px] font-bold text-slate-200 truncate block">
                        {sample.label.split(' ')[1]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Barcode Text Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualInput.trim()) executeLookup(manualInput.trim());
                }}
                className="pt-2 border-t border-slate-800/80 flex items-center space-x-2"
              >
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter or scan Asset Tag / Serial (e.g. AST-SCN-00112)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualInput.trim() || isSearching}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center space-x-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Lookup</span>
                </button>
              </form>
            </>
          ) : (
            /* Scanned Asset Profile Card */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/30 space-y-4">
                {/* Header Strip */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                        {scannedAsset.assetTag}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          scannedAsset.status === 'ASSIGNED'
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : scannedAsset.status === 'IN_STOCK'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {scannedAsset.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{scannedAsset.name}</h3>
                    <p className="text-xs text-slate-400">
                      {scannedAsset.brand} • Model: {scannedAsset.model} • Serial: <span className="font-mono text-slate-300">{scannedAsset.serialNumber}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Book Value</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      ₹{scannedAsset.currentBookValue?.toLocaleString() || scannedAsset.purchaseCost?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <User className="w-3 h-3 text-indigo-400" />
                      <span>Current Custodian</span>
                    </span>
                    <p className="font-bold text-slate-200">
                      {scannedAsset.assignedTo?.name || 'Unassigned (Warehouse)'}
                    </p>
                    {scannedAsset.assignedTo?.code && (
                      <p className="text-[10px] text-slate-400">{scannedAsset.assignedTo.code} • {scannedAsset.assignedTo.department}</p>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-purple-400" />
                      <span>Facility Location</span>
                    </span>
                    <p className="font-bold text-slate-200">{scannedAsset.locationName}</p>
                    <p className="text-[10px] text-slate-400">Primary Base</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                      <span>Physical Audit</span>
                    </span>
                    {scannedAsset.lastAuditedAt ? (
                      <div>
                        <p className="font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(scannedAsset.lastAuditedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="font-bold text-amber-400">Audit Pending</p>
                    )}
                  </div>
                </div>

                {/* Audit Confirmation Ribbon if freshly verified */}
                {auditSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Physical Audit Verified!</strong> Non-repudiable audit event logged in immutable system ledger.
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={resumeScanner}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Scan Another Barcode</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleVerifyAudit}
                    disabled={isAuditing}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isAuditing ? 'Recording Audit...' : 'Mark Physical Audit Verified'}</span>
                  </button>
                  {onAssetSelected && (
                    <button
                      onClick={() => {
                        onAssetSelected(scannedAsset);
                        onClose();
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      <span>Select Asset</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Barcode className="w-3.5 h-3.5 text-slate-400" />
            <span>Supports Code 128, QR Code, DataMatrix, UPC & EAN</span>
          </span>
          <span>SOC 2 & ISO 27001 Physical Verification</span>
        </div>
      </div>
    </div>
  );
};
