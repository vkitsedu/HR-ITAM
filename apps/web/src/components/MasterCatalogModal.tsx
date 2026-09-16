import React, { useEffect, useState } from 'react';
import {
  X,
  Boxes,
  Plus,
  Save,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Laptop,
  Monitor,
  Cpu,
  Server,
  Headphones,
  Box,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api';

interface MasterCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated?: () => void;
}

export const MasterCatalogModal: React.FC<MasterCatalogModalProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdated,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Category State
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    tagPrefix: '',
    minSafetyBuffer: 3,
    usefulLifeMonths: 36,
    salvageValuePercent: 5.0,
    requiresCustodySign: true,
    isSerialized: true,
    icon: 'Box',
  });

  // Deleting Category State
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);

  // New Category Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    tagPrefix: '',
    minSafetyBuffer: 3,
    usefulLifeMonths: 36,
    salvageValuePercent: 5.0,
    requiresCustodySign: true,
    isSerialized: true,
    icon: 'Box',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/itam/catalog/categories');
      setCategories(res.data || []);
    } catch (e: any) {
      console.error('Failed to load categories:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setShowAddForm(false);
      setEditingCategory(null);
      setDeletingCategory(null);
      setNotification(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    if (!formData.code || !formData.name || !formData.tagPrefix) {
      setNotification({ type: 'error', message: 'Code, Name, and Tag Prefix are required.' });
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/itam/catalog/categories', formData);
      await fetchCategories();
      setShowAddForm(false);
      setFormData({
        code: '',
        name: '',
        tagPrefix: '',
        minSafetyBuffer: 3,
        usefulLifeMonths: 36,
        salvageValuePercent: 5.0,
        requiresCustodySign: true,
        isSerialized: true,
        icon: 'Box',
      });
      setNotification({ type: 'success', message: `Category "${formData.name}" created successfully!` });
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (e: any) {
      setNotification({ type: 'error', message: e.response?.data?.error || 'Failed to create category' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (cat: any) => {
    setEditingCategory(cat);
    setEditFormData({
      name: cat.name,
      tagPrefix: cat.tagPrefix,
      minSafetyBuffer: cat.minSafetyBuffer,
      usefulLifeMonths: cat.usefulLifeMonths,
      salvageValuePercent: cat.salvageValuePercent ?? 5.0,
      requiresCustodySign: cat.requiresCustodySign,
      isSerialized: cat.isSerialized,
      icon: cat.icon || 'Box',
    });
    setShowAddForm(false);
    setNotification(null);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setNotification(null);

    try {
      setIsSaving(true);
      await api.put(`/itam/catalog/categories/${editingCategory.id}`, editFormData);
      await fetchCategories();
      setEditingCategory(null);
      setNotification({ type: 'success', message: `Category "${editFormData.name}" updated successfully!` });
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (e: any) {
      setNotification({ type: 'error', message: e.response?.data?.error || 'Failed to update category' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setNotification(null);

    try {
      setIsSaving(true);
      const res = await api.delete(`/itam/catalog/categories/${deletingCategory.id}`);
      await fetchCategories();
      setDeletingCategory(null);
      setNotification({
        type: 'success',
        message: res.data?.message || `Category "${deletingCategory.name}" removed successfully.`,
      });
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (e: any) {
      setNotification({ type: 'error', message: e.response?.data?.error || 'Failed to delete category' });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Laptop':
        return <Laptop className="w-4 h-4 text-blue-400" />;
      case 'Monitor':
        return <Monitor className="w-4 h-4 text-purple-400" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'Smartphone':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'Server':
        return <Server className="w-4 h-4 text-rose-400" />;
      case 'Headphones':
        return <Headphones className="w-4 h-4 text-cyan-400" />;
      default:
        return <Box className="w-4 h-4 text-indigo-400" />;
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.tagPrefix?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Tenant Master Inventory Catalog</span>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold">
                  Multi-Tenant Catalog
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Customize asset categories, safety buffers, depreciation life, tag prefixes & policy enforcement
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notification Alert */}
          {notification && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchCategories}
                title="Refresh catalog"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingCategory(null);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'Cancel New Category' : 'Add Custom Category'}</span>
              </button>
            </div>
          </div>

          {/* Add Category Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateCategory}
              className="p-4 bg-slate-950/90 border border-indigo-500/40 rounded-xl space-y-4 animate-in fade-in shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Tenant Catalog Category</span>
                </span>
                <span className="text-[11px] text-slate-400">Fill in details for the custom item</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. MOBILE, SCANNER"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                        tagPrefix: formData.tagPrefix || `AST-${e.target.value.slice(0, 3).toUpperCase()}`,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 uppercase font-mono focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Smartphones & Tablets"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tag Prefix *</label>
                  <input
                    type="text"
                    placeholder="e.g. AST-MOB"
                    value={formData.tagPrefix}
                    onChange={(e) => setFormData({ ...formData, tagPrefix: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono uppercase focus:border-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Min Safety Buffer</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minSafetyBuffer}
                    onChange={(e) => setFormData({ ...formData, minSafetyBuffer: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Low stock alert triggers below this count</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Useful Life (Months)</label>
                  <select
                    value={formData.usefulLifeMonths}
                    onChange={(e) => setFormData({ ...formData, usefulLifeMonths: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="12">12 Months (1 Year - Peripherals)</option>
                    <option value="24">24 Months (2 Years - Mobiles / Tablets)</option>
                    <option value="36">36 Months (3 Years - Laptops / PCs)</option>
                    <option value="48">48 Months (4 Years - Scanners / POS)</option>
                    <option value="60">60 Months (5 Years - Enterprise Servers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Icon Representation</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Smartphone">Smartphone / Mobile</option>
                    <option value="Laptop">Laptop / Portable</option>
                    <option value="Monitor">Monitor / Display</option>
                    <option value="Cpu">Workstation / Desktop</option>
                    <option value="Server">Server / Rack</option>
                    <option value="Headphones">Accessory / Peripherals</option>
                    <option value="Box">General Workplace Gear</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-1 text-xs text-slate-300">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresCustodySign}
                    onChange={(e) => setFormData({ ...formData, requiresCustodySign: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Requires Digital Custody Sign-Off</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSerialized}
                    onChange={(e) => setFormData({ ...formData, isSerialized: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Serialized Barcode Tracking</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Creating...' : 'Save to Catalog'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Edit Category Modal / Form */}
          {editingCategory && (
            <form
              onSubmit={handleUpdateCategory}
              className="p-4 bg-slate-950/90 border border-blue-500/40 rounded-xl space-y-4 animate-in fade-in shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-blue-300 flex items-center space-x-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Category: {editingCategory.name} ({editingCategory.code})</span>
                </span>
                <span className="text-[11px] text-slate-400">Code is immutable for data integrity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Display Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tag Prefix *</label>
                  <input
                    type="text"
                    value={editFormData.tagPrefix}
                    onChange={(e) => setEditFormData({ ...editFormData, tagPrefix: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono uppercase focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Min Safety Buffer (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.minSafetyBuffer}
                    onChange={(e) => setEditFormData({ ...editFormData, minSafetyBuffer: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Useful Life (Months)</label>
                  <select
                    value={editFormData.usefulLifeMonths}
                    onChange={(e) => setEditFormData({ ...editFormData, usefulLifeMonths: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-blue-500 outline-none"
                  >
                    <option value="12">12 Months (1 Year - Peripherals)</option>
                    <option value="24">24 Months (2 Years - Mobiles / Tablets)</option>
                    <option value="36">36 Months (3 Years - Laptops / PCs)</option>
                    <option value="48">48 Months (4 Years - Scanners / POS)</option>
                    <option value="60">60 Months (5 Years - Enterprise Servers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Salvage Value (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editFormData.salvageValuePercent}
                    onChange={(e) => setEditFormData({ ...editFormData, salvageValuePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Icon Representation</label>
                  <select
                    value={editFormData.icon}
                    onChange={(e) => setEditFormData({ ...editFormData, icon: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-blue-500 outline-none"
                  >
                    <option value="Smartphone">Smartphone / Mobile</option>
                    <option value="Laptop">Laptop / Portable</option>
                    <option value="Monitor">Monitor / Display</option>
                    <option value="Cpu">Workstation / Desktop</option>
                    <option value="Server">Server / Rack</option>
                    <option value="Headphones">Accessory / Peripherals</option>
                    <option value="Box">General Workplace Gear</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-1 text-xs text-slate-300">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.requiresCustodySign}
                    onChange={(e) => setEditFormData({ ...editFormData, requiresCustodySign: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Requires Digital Custody Sign-Off</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isSerialized}
                    onChange={(e) => setEditFormData({ ...editFormData, isSerialized: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Serialized Barcode Tracking</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Delete Confirmation Modal / Alert */}
          {deletingCategory && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-3 animate-in fade-in shadow-xl">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Confirm Category Deletion: {deletingCategory.name} ({deletingCategory.code})</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {deletingCategory.totalAssets > 0 ? (
                  <>
                    This category currently has <strong className="text-amber-400">{deletingCategory.totalAssets} assets</strong> associated with it. To protect historical audit logs, depreciation ledgers, and existing inventory data, this category will be <strong className="text-rose-300">safely archived</strong> (hidden from new inwarding and active selectors) rather than hard-deleted.
                  </>
                ) : (
                  <>
                    This category has <strong className="text-emerald-400">0 assets</strong> linked to it. It will be <strong className="text-rose-300">permanently removed</strong> from your tenant catalog.
                  </>
                )}
              </p>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Processing...' : deletingCategory.totalAssets > 0 ? 'Safe Archive Category' : 'Delete Category'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Catalog Categories Table */}
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading catalog items...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
              No categories found matching your search.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-3 py-3">Tag Prefix</th>
                    <th className="px-3 py-3">Min Safety Buffer</th>
                    <th className="px-3 py-3">Useful Life</th>
                    <th className="px-3 py-3">Custody Required</th>
                    <th className="px-3 py-3">Active Units</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2.5">
                          {getCategoryIcon(cat.icon)}
                          <div>
                            <span className="font-semibold text-slate-200">{cat.name}</span>
                            <span className="ml-2 font-mono text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                              {cat.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-300">{cat.tagPrefix}</td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-200">{cat.minSafetyBuffer} units</span>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        <span>{cat.usefulLifeMonths} Months</span>
                      </td>
                      <td className="px-3 py-3">
                        {cat.requiresCustodySign ? (
                          <span className="text-emerald-400 text-[10px] font-semibold flex items-center">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            Required
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No (General)</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-bold text-slate-200">{cat.totalAssets}</span>{' '}
                        <span className="text-[10px] text-slate-400">({cat.inStockUnits} in stock)</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            title="Edit Category Details"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingCategory(cat);
                              setEditingCategory(null);
                              setShowAddForm(false);
                            }}
                            title="Delete or Archive Category"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>All category updates immediately propagate to safety buffers, asset forms, and NOC radar.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

