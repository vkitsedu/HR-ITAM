import React, { useEffect, useState } from 'react';
import {
  X,
  PackagePlus,
  Boxes,
  Barcode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api';

interface AssetInwardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInwardSuccess: () => void;
}

export const AssetInwardingModal: React.FC<AssetInwardingModalProps> = ({
  isOpen,
  onClose,
  onInwardSuccess,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseCostPerUnit, setPurchaseCostPerUnit] = useState(75000);
  const [warrantyMonths, setWarrantyMonths] = useState(36);
  const [locationId, setLocationId] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [catsRes, locsRes] = await Promise.all([
        api.get('/itam/catalog/categories'),
        api.get('/hr/locations'),
      ]);
      const cats = catsRes.data || [];
      setCategories(cats);
      if (cats.length > 0) setSelectedCategoryId(cats[0].id);

      const locs = locsRes.data || [];
      setLocations(locs);
      if (locs.length > 0) setLocationId(locs[0].id);
    } catch (e: any) {
      console.error('Failed to load inwarding metadata:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setErrorMsg(null);
      setSuccessResult(null);
      setBrand('Dell');
      setModel('Latitude 5440');
      setVendorName('CompTech Enterprise Dist.');
      setPurchaseOrderNumber(`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setPurchaseCostPerUnit(78500);
      setSerialInput('DL-LAT5440-9901\nDL-LAT5440-9902\nDL-LAT5440-9903');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const serialsList = serialInput
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const totalUnits = selectedCategory?.isSerialized ? serialsList.length : Math.max(1, quantity);
  const totalCapEx = totalUnits * (Number(purchaseCostPerUnit) || 0);

  const handleGenerateSampleSerials = () => {
    const prefix = selectedCategory?.code?.slice(0, 3) || 'DEV';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const mock = [
      `SN-${prefix}-${rand}-A`,
      `SN-${prefix}-${rand}-B`,
      `SN-${prefix}-${rand}-C`,
    ].join('\n');
    setSerialInput(mock);
  };

  const handleSubmitInward = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCategoryId) {
      setErrorMsg('Please select a valid inventory category from the Master Catalog');
      return;
    }
    if (!brand || !model) {
      setErrorMsg('Brand and model are required');
      return;
    }
    if (selectedCategory?.isSerialized && serialsList.length === 0) {
      setErrorMsg('Please enter or scan at least one valid serial number');
      return;
    }

    try {
      setIsSubmitting(true);

      const pDate = new Date(purchaseDate);
      const wDate = new Date(pDate.getTime() + warrantyMonths * 30 * 24 * 3600 * 1000);

      const payload = {
        categoryId: selectedCategoryId,
        brand,
        model,
        vendorName,
        purchaseOrderNumber,
        purchaseDate,
        purchaseCostPerUnit: Number(purchaseCostPerUnit),
        warrantyExpiry: wDate.toISOString().split('T')[0],
        locationId,
        serialNumbers: selectedCategory?.isSerialized ? serialsList : undefined,
        quantity: !selectedCategory?.isSerialized ? quantity : undefined,
      };

      const res = await api.post('/itam/inwards/batch', payload);
      setSuccessResult(res.data);
      onInwardSuccess();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || 'Failed to inward assets');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Warehouse Goods Receipt Note (GRN) Inwarding</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold">
                  Stock Inwards
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inward new batch of hardware assets from vendor PO into live warehouse safety stock
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {successResult ? (
            <div className="p-6 text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Stock Inwarding Complete!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Successfully stocked <strong>{successResult.unitsInwarded} unit(s)</strong> of{' '}
                  <span className="text-indigo-400 font-semibold">{successResult.category}</span>.
                </p>
                <p className="text-xs text-emerald-400 font-mono mt-1 font-bold">
                  Added CapEx Valuation: ₹{successResult.totalCapExAdded.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 text-left max-h-40 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Generated Asset Tags:
                </span>
                {successResult.assets?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-slate-300 font-mono">
                    <span className="text-indigo-400 font-bold">{a.assetTag}</span>
                    <span className="text-slate-400">{a.serialNumber}</span>
                    <span className="text-emerald-400 text-[10px] font-semibold">{a.status}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow"
                >
                  Back to Fleet Telemetry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitInward} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Master Catalog Category Selector */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  1. Select Master Inventory Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {categories.map((c) => {
                    const isSelected = c.id === selectedCategoryId;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setSelectedCategoryId(c.id)}
                        className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold truncate text-[11px]">{c.name}</span>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="font-mono">{c.tagPrefix}</span>
                          <span className="text-slate-500">Min: {c.minSafetyBuffer}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hardware Spec & PO Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Brand *</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Dell, Zebra"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Model / Variant *</label>
                  <input
                    type="text"
                    placeholder="e.g. Latitude 5440, iPhone 15"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={purchaseCostPerUnit}
                    onChange={(e) => setPurchaseCostPerUnit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:border-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vendor / Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Ingram Micro, Redington"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Purchase Order (PO) #</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-8812"
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Warehouse Location</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Serial Number Scanning / Inwarding Station */}
              {selectedCategory?.isSerialized ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center space-x-1.5">
                      <Barcode className="w-4 h-4 text-indigo-400" />
                      <span>Serial Numbers (1 per line or scan with barcode gun) *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSampleSerials}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-semibold"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Sample Serials</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    placeholder="Scan barcodes or paste serials here:&#10;SN-889101&#10;SN-889102&#10;SN-889103"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Detected: <strong className="text-indigo-400">{serialsList.length}</strong> unit(s)
                    </span>
                    <span>
                      Tag format:{' '}
                      <strong className="text-slate-200 font-mono">
                        {selectedCategory?.tagPrefix}-00XXX
                      </strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bulk Non-Serialized Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-48 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              )}

              {/* CapEx & Inward Summary Bar */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase">Total Batch Valuation</span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">
                    ₹{totalCapEx.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase">Units to Stock</span>
                  <span className="text-lg font-extrabold text-slate-100">
                    +{totalUnits} {selectedCategory?.name}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || totalUnits === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold shadow-lg flex items-center space-x-1.5 transition"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Inwarding...' : `Confirm & Inward ${totalUnits} Units`}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
