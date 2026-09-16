import React, { useEffect, useState } from 'react';
import {
  Laptop,
  Plus,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  UserCheck,
  Search,
  Filter,
  Printer,
  FileCheck,
  FileText,
  Boxes,
  PackagePlus,
  Settings,
  ScanLine,
} from 'lucide-react';
import { api } from '../api';
import { CustodyCertificateModal } from '../components/CustodyCertificateModal';
import { MasterCatalogModal } from '../components/MasterCatalogModal';
import { AssetInwardingModal } from '../components/AssetInwardingModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

interface ItamViewProps {
  onNavigateStock?: () => void;
  initialStatusFilter?: string;
}

export const ItamView: React.FC<ItamViewProps> = ({ onNavigateStock, initialStatusFilter }) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<any>(null);
  const [showTagModal, setShowTagModal] = useState<any>(null);
  const [auditingAssetId, setAuditingAssetId] = useState<string | null>(null);
  const [viewingCertReceiptId, setViewingCertReceiptId] = useState<string | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // New Asset Form
  const [newAsset, setNewAsset] = useState({
    assetTag: '',
    name: '',
    category: 'LAPTOP',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 85000,
    warrantyExpiry: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    locationId: '',
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [assetRes, empRes, locRes] = await Promise.all([
        api.get('/itam/assets'),
        api.get('/hr/employees'),
        api.get('/hr/locations'),
      ]);
      setAssets(assetRes.data);
      setEmployees(empRes.data);
      setLocations(locRes.data);
      if (locRes.data[0]) setNewAsset((prev) => ({ ...prev, locationId: locRes.data[0].id }));
      if (empRes.data[0]) setSelectedEmployeeId(empRes.data[0].id);
    } catch (e) {
      console.error('Failed to load ITAM data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/itam/assets', { ...newAsset, purchaseCost: Number(newAsset.purchaseCost) });
      setShowAddAssetModal(false);
      fetchData();
      alert('Asset registered into inventory!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create asset');
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal || !selectedEmployeeId) return;
    try {
      await api.post('/itam/assign', {
        assetId: showAssignModal.id,
        employeeId: selectedEmployeeId,
      });
      setShowAssignModal(null);
      fetchData();
      alert('Asset assigned! Digital custody acknowledgement task sent to employee portal.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign asset');
    }
  };

  const handleReturnAsset = async (asset: any) => {
    if (!asset.custodyReceiptId) return;
    if (!confirm(`Mark asset ${asset.assetTag} (${asset.name}) as returned to inventory?`)) return;
    try {
      const res = await api.post(`/itam/custody/${asset.custodyReceiptId}/return`);
      fetchData();
      if (res.data.autoNocIssued) {
        alert(`Asset returned! Employee has returned all assigned hardware. IT NOC for Full & Final Settlement has been AUTOMATICALLY ISSUED!`);
      } else {
        alert(`Asset marked returned and returned to IN_STOCK.`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to return asset');
    }
  };

  const handleQuickAudit = async (asset: any) => {
    try {
      setAuditingAssetId(asset.id);
      await api.post(`/itam/assets/${asset.id}/audit`, {
        notes: 'Physical barcode verification via ITAM Console',
      });
      await fetchData();
      alert(`Asset ${asset.assetTag} successfully audited & verified!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record audit');
    } finally {
      setAuditingAssetId(null);
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const inStockCount = assets.filter((a) => a.status === 'IN_STOCK').length;
  const assignedCount = assets.filter((a) => a.status === 'ASSIGNED').length;
  const inRepairCount = assets.filter((a) => a.status === 'IN_REPAIR').length;
  const needsAuditCount = assets.filter((a) => !a.lastAuditedAt).length;

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assignedToEmployeeName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'IN_STOCK') return a.status === 'IN_STOCK';
    if (statusFilter === 'ASSIGNED') return a.status === 'ASSIGNED';
    if (statusFilter === 'IN_REPAIR') return a.status === 'IN_REPAIR';
    if (statusFilter === 'NEEDS_AUDIT') return !a.lastAuditedAt;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">IT Hardware Fleet & Custody Tracker</h2>
            <p className="text-xs text-slate-400">
              End-to-End Asset Lifecycle with Digital In-App Handover & F&F Settlement NOC Clearance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
            title="Configure Tenant Master Inventory Catalog"
          >
            <Boxes className="w-4 h-4 text-indigo-400" />
            <span>Master Catalog</span>
          </button>
          <button
            onClick={() => setShowInwardModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            title="Warehouse Goods Receipt Note (GRN) Multi-Asset Inwarding"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Inward Assets (GRN)</span>
          </button>
          <button
            onClick={() => setShowScannerModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            title="Scan Physical Asset Barcode with Camera or Simulator"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Barcode</span>
          </button>
          {onNavigateStock && (
            <button
              onClick={onNavigateStock}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Boxes className="w-4 h-4 text-purple-400" />
              <span>Stock Reports</span>
            </button>
          )}
          <button
            onClick={() => setShowAddAssetModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Single</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
              }`}
            >
              All ({assets.length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_STOCK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'IN_STOCK'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStatusFilter('ASSIGNED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'ASSIGNED'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
              }`}
            >
              Assigned ({assignedCount})
            </button>
            <button
              onClick={() => setStatusFilter('IN_REPAIR')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'IN_REPAIR'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
              }`}
            >
              In Repair ({inRepairCount})
            </button>
            <button
              onClick={() => setStatusFilter('NEEDS_AUDIT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'NEEDS_AUDIT'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
              }`}
            >
              Needs Audit ({needsAuditCount})
            </button>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by tag, serial, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Asset Tag & Device</th>
                <th className="px-5 py-3">Serial Number</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Purchase Cost</th>
                <th className="px-5 py-3">Current Custodian</th>
                <th className="px-5 py-3">Custody Status</th>
                <th className="px-5 py-3">Physical Audit</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-100">{a.name}</p>
                    <p className="text-[11px] text-indigo-400 font-mono font-semibold">{a.assetTag}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-300">{a.serialNumber}</td>
                  <td className="px-5 py-3.5 text-slate-300 font-medium">{a.locationName || 'Unassigned'}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-200 font-semibold">
                    ₹{a.purchaseCost?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5">
                    {a.assignedToEmployeeName ? (
                      <div>
                        <p className="font-semibold text-slate-200">{a.assignedToEmployeeName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{a.assignedToEmployeeCode}</p>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">
                        Available in Stock
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {a.custodyStatus ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          a.custodyStatus === 'ACKNOWLEDGED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : a.custodyStatus === 'PENDING_ACKNOWLEDGEMENT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {a.custodyStatus.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {a.lastAuditedAt ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1 text-emerald-400 font-semibold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(a.lastAuditedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setShowTagModal(a)}
                        title="Print Asset Tag / QR Barcode Sticker"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleQuickAudit(a)}
                        disabled={auditingAssetId === a.id}
                        title="Record Physical Barcode Audit"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded transition"
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${auditingAssetId === a.id ? 'animate-spin' : ''}`} />
                      </button>
                      {a.custodyReceiptId && a.custodyStatus === 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => setViewingCertReceiptId(a.custodyReceiptId)}
                          title="View Digital Custody Certificate"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 rounded transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {a.status === 'IN_STOCK' ? (
                        <button
                          onClick={() => setShowAssignModal(a)}
                          className="px-2.5 py-1 text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition"
                        >
                          Assign Custody
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReturnAsset(a)}
                          className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-semibold transition flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span>Return</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Laptop className="w-5 h-5 text-indigo-400" />
                <span>Register Hardware Asset</span>
              </h3>
              <button onClick={() => setShowAddAssetModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Asset Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="AST-LAP-00105"
                    value={newAsset.assetTag}
                    onChange={(e) => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="DESKTOP">Desktop Workstation</option>
                    <option value="MONITOR">Monitor / Display</option>
                    <option value="SERVER">Server</option>
                    <option value="PERIPHERAL">Docking Station / Peripheral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="Apple MacBook Air 15-inch M3 (16GB/512GB)"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="Apple"
                    value={newAsset.brand}
                    onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="MacBook Air 15"
                    value={newAsset.model}
                    onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Serial Number</label>
                  <input
                    type="text"
                    required
                    placeholder="C02GL129XYZ"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={newAsset.purchaseDate}
                    onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={newAsset.purchaseCost}
                    onChange={(e) => setNewAsset({ ...newAsset, purchaseCost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Office Location</label>
                  <select
                    value={newAsset.locationId}
                    onChange={(e) => setNewAsset({ ...newAsset, locationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Register in Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Asset Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>Assign Asset Custody</span>
              </h3>
              <button onClick={() => setShowAssignModal(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-indigo-300">
                Device: {showAssignModal.name} ({showAssignModal.assetTag})
              </p>
              <p className="text-slate-400 font-mono">Serial: {showAssignModal.serialNumber}</p>
              <p className="text-[11px] text-indigo-400/90 font-medium">
                ⚡ Assigning will dispatch a digital handover task to the employee's portal for in-app signature.
              </p>
            </div>

            <form onSubmit={handleAssignAsset} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Select Employee Custodian</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Confirm & Dispatch Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable QR / Barcode Tag Sticker Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Asset Tag & Physical Barcode Sticker</h3>
                  <p className="text-[11px] text-slate-400">High-Resolution Thermal Label Ready for Printing</p>
                </div>
              </div>
              <button onClick={() => setShowTagModal(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            {/* Printable Physical Sticker Card */}
            <div id="printable-asset-tag" className="bg-white text-slate-950 p-6 rounded-xl border-2 border-slate-900 shadow-inner select-none font-sans space-y-4">
              {/* Sticker Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <h4 className="text-xs font-black tracking-wider uppercase">ACME Technologies India</h4>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">IT Infrastructure Fleet</p>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-slate-900 rounded">
                  {showTagModal.category}
                </span>
              </div>

              {/* Barcode & Asset Tag */}
              <div className="text-center py-1 space-y-1">
                <div className="flex justify-center items-center py-2 bg-slate-50 border border-slate-200 rounded">
                  {/* SVG Barcode Visualization */}
                  <svg className="h-12 w-64 max-w-full" viewBox="0 0 240 50">
                    <rect x="0" y="0" width="240" height="50" fill="#f8fafc" />
                    {/* Simulated Code 128 barcode pattern */}
                    {[
                      2,1,3,1,1,2,3,2,1,1,2,4,1,2,1,3,2,1,2,1,3,1,4,1,1,2,3,2,1,2,2,1,3,1,2,4,1,1,2,3,
                      2,1,1,3,2,1,4,1,2,1,3,2,1,1,2,3,1,4,2,1,1,2,3,1,2,1,4,2,1,1,3,2,1,2,4,1,2,1,1,3
                    ].reduce((acc: any[], width, idx) => {
                      const prevX = acc.length > 0 ? acc[acc.length - 1].x + acc[acc.length - 1].w : 10;
                      if (idx % 2 === 0) {
                        acc.push({ x: prevX, w: width * 2 });
                      } else {
                        acc.push({ x: prevX, w: width * 1.5, space: true });
                      }
                      return acc;
                    }, []).filter((b: any) => !b.space).map((bar: any, i: number) => (
                      <rect key={i} x={bar.x} y="5" width={bar.w} height="40" fill="#0f172a" />
                    ))}
                  </svg>
                </div>
                <p className="font-mono text-base font-black tracking-widest text-slate-950">
                  {showTagModal.assetTag}
                </p>
              </div>

              {/* QR & Metadata Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-300 items-center">
                {/* Simulated QR Pattern */}
                <div className="w-20 h-20 bg-slate-950 p-1.5 rounded flex items-center justify-center mx-auto">
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

                <div className="col-span-2 text-[10px] space-y-1 font-medium">
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold">Device:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[130px]">{showTagModal.brand} {showTagModal.model}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold">Serial No:</span>
                    <span className="font-mono font-bold text-slate-900">{showTagModal.serialNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold">Custodian:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[130px]">
                      {showTagModal.assignedToEmployeeName || 'Stock (Unassigned)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase text-[8px] font-bold">Facility:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[130px]">{showTagModal.locationName || 'Bengaluru HQ'}</span>
                  </div>
                </div>
              </div>

              {/* Security Warning Notice */}
              <div className="pt-2 border-t-2 border-slate-900 text-center">
                <p className="text-[7.5px] font-extrabold uppercase tracking-tight text-slate-700">
                  NOTICE: PROPERTY OF ACME TECHNOLOGIES. UNAUTHORIZED REMOVAL IS STRICTLY PROHIBITED.
                </p>
                <p className="text-[7px] text-slate-500">IF FOUND, PLEASE CONTACT IT HELPDESK OR NOC@ACME.COM</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">Size: 2.25" x 1.25" Thermal Compatible</span>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowTagModal(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sticker</span>
                </button>
              </div>
            </div>
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

      {/* Tenant Master Catalog Modal */}
      <MasterCatalogModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onCategoriesUpdated={fetchData}
      />

      {/* Asset Inwarding (GRN) Modal */}
      <AssetInwardingModal
        isOpen={showInwardModal}
        onClose={() => setShowInwardModal(false)}
        onInwardSuccess={() => {
          fetchData();
          setShowInwardModal(false);
        }}
      />

      {/* Barcode & QR Scanner Modal */}
      {showScannerModal && (
        <BarcodeScannerModal
          isOpen={showScannerModal}
          onClose={() => {
            setShowScannerModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};
