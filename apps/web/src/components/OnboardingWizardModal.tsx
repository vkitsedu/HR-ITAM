import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Boxes,
  Shield,
  Palette,
  Sliders,
  Rocket,
  Plus,
  Trash2,
  Building2,
  Stethoscope,
  Truck,
  Landmark,
  Laptop,
  Check,
  RotateCcw,
} from 'lucide-react';
import { api } from '../api';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onApplied,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('TECH_SAAS');
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Step 2: Customizable Categories
  const [editableCategories, setEditableCategories] = useState<any[]>([]);

  // Step 3: Themes & Branding
  const [selectedTheme, setSelectedTheme] = useState<string>('indigo');
  const [workspaceName, setWorkspaceName] = useState<string>('Acme Global Enterprises');

  // Step 4: Governance Policies
  const [policies, setPolicies] = useState({
    enforceSerialization: true,
    requireCustodySignOff: true,
    realtimeBufferAlerts: true,
    autoDepreciationLedger: true,
  });

  // Fetch templates on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsCompleted(false);
      setErrorMsg(null);
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/itam/catalog/templates');
      const data = res.data || [];
      setTemplates(data);
      if (data.length > 0) {
        const initial = data[0];
        setSelectedTemplateId(initial.id);
        setEditableCategories(JSON.parse(JSON.stringify(initial.categories || [])));
        setSelectedTheme(initial.recommendedTheme || 'indigo');
      }
    } catch (e: any) {
      console.error('Failed to load templates:', e);
      setErrorMsg('Failed to load industry templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplateId(tpl.id);
    setEditableCategories(JSON.parse(JSON.stringify(tpl.categories || [])));
    setSelectedTheme(tpl.recommendedTheme || 'indigo');
  };

  const handleCategoryFieldChange = (index: number, field: string, value: any) => {
    setEditableCategories((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddCategoryRow = () => {
    setEditableCategories((prev) => [
      ...prev,
      {
        code: `CUSTOM_${Date.now().toString().slice(-4)}`,
        name: 'New Custom Asset Item',
        tagPrefix: 'AST-CUST',
        minSafetyBuffer: 3,
        usefulLifeMonths: 36,
        salvageValuePercent: 5.0,
        requiresCustodySign: true,
        isSerialized: true,
        icon: 'Box',
      },
    ]);
  };

  const handleRemoveCategoryRow = (index: number) => {
    setEditableCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyConfiguration = async () => {
    try {
      setIsApplying(true);
      setErrorMsg(null);

      // Save theme to localStorage for live branding
      localStorage.setItem('empops_client_theme', selectedTheme);
      localStorage.setItem('empops_workspace_name', workspaceName);

      await api.post('/itam/catalog/templates/apply', {
        templateId: selectedTemplateId,
        customCategories: editableCategories,
      });

      setIsCompleted(true);
      if (onApplied) onApplied();
    } catch (e: any) {
      console.error('Failed to apply template:', e);
      setErrorMsg(e.response?.data?.error || 'Failed to initialize workspace template');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  const getTemplateIcon = (tplId: string) => {
    switch (tplId) {
      case 'TECH_SAAS':
        return <Laptop className="w-5 h-5 text-indigo-400" />;
      case 'HEALTHCARE':
        return <Stethoscope className="w-5 h-5 text-emerald-400" />;
      case 'LOGISTICS_MANUFACTURING':
        return <Truck className="w-5 h-5 text-amber-400" />;
      case 'BFSI_FINTECH':
        return <Landmark className="w-5 h-5 text-cyan-400" />;
      default:
        return <Building2 className="w-5 h-5 text-purple-400" />;
    }
  };

  const themeOptions = [
    { id: 'indigo', name: 'Cyber Indigo', bg: 'bg-indigo-600', border: 'border-indigo-500', desc: 'Modern High-Tech SaaS' },
    { id: 'emerald', name: 'Clinical Mint', bg: 'bg-emerald-600', border: 'border-emerald-500', desc: 'Healthcare & Diagnostics' },
    { id: 'amber', name: 'Industrial Titanium', bg: 'bg-amber-600', border: 'border-amber-500', desc: 'Logistics & Supply Chain' },
    { id: 'cyan', name: 'Regal Cobalt', bg: 'bg-cyan-600', border: 'border-cyan-500', desc: 'BFSI & Regulated FinTech' },
    { id: 'purple', name: 'Deep Amethyst', bg: 'bg-purple-600', border: 'border-purple-500', desc: 'Enterprise Operations' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Wizard Top Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">Welcome & Onboarding Customization Wizard</h3>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold">
                  Multi-Industry Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tailor catalog templates, UI themes, buffer rules, and compliance governance to your organization
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

        {/* Wizard Stepper Progress Bar */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs">
          {[
            { step: 1, label: 'Industry Archetype' },
            { step: 2, label: 'Catalog Items' },
            { step: 3, label: 'Theme & Branding' },
            { step: 4, label: 'Governance Policies' },
            { step: 5, label: 'Review & Launch' },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step || isCompleted;

            return (
              <button
                key={s.step}
                onClick={() => !isCompleted && s.step <= currentStep && setCurrentStep(s.step)}
                disabled={isCompleted || s.step > currentStep}
                className={`flex items-center space-x-2 transition ${
                  isActive
                    ? 'text-indigo-400 font-bold'
                    : isDone
                    ? 'text-emerald-400 font-medium'
                    : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : isDone
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-600'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.step}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <span className="font-semibold">Notice:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Select Industry Archetype */}
          {currentStep === 1 && !isCompleted && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-slate-100">Step 1: Choose Your Industry Template</h4>
                <p className="text-xs text-slate-400">
                  Select an industry preset to preload best-practice hardware categories, safety thresholds, and depreciation schedules.
                </p>
              </div>

              {isLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading industry archetypes...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`p-4 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-lg'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                {getTemplateIcon(tpl.id)}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-100">{tpl.name}</h5>
                                <span className="text-[10px] text-slate-400">{tpl.categories?.length || 0} preconfigured categories</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{tpl.description}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                          {tpl.categories?.slice(0, 3).map((c: any) => (
                            <span
                              key={c.code}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                            >
                              {c.name}
                            </span>
                          ))}
                          {(tpl.categories?.length || 0) > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 text-slate-500 font-medium">
                              +{tpl.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Customize Categories */}
          {currentStep === 2 && !isCompleted && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Step 2: Review & Customize Catalog Items</h4>
                  <p className="text-xs text-slate-400">
                    Adjust item names, safety buffer thresholds, useful amortization life, or add unique hardware items.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCategoryRow}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Item</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/90 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
                    <tr>
                      <th className="px-3 py-2.5">Code</th>
                      <th className="px-3 py-2.5">Display Name</th>
                      <th className="px-2 py-2.5">Prefix</th>
                      <th className="px-2 py-2.5">Buffer</th>
                      <th className="px-2 py-2.5">Useful Life</th>
                      <th className="px-2 py-2.5">Custody Sign</th>
                      <th className="px-2 py-2.5 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {editableCategories.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={cat.code}
                            onChange={(e) =>
                              handleCategoryFieldChange(idx, 'code', e.target.value.toUpperCase().replace(/\s+/g, '_'))
                            }
                            className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-indigo-300 uppercase outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => handleCategoryFieldChange(idx, 'name', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={cat.tagPrefix}
                            onChange={(e) => handleCategoryFieldChange(idx, 'tagPrefix', e.target.value.toUpperCase())}
                            className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-300 uppercase outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="1"
                            value={cat.minSafetyBuffer}
                            onChange={(e) =>
                              handleCategoryFieldChange(idx, 'minSafetyBuffer', parseInt(e.target.value, 10) || 1)
                            }
                            className="w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={cat.usefulLifeMonths}
                            onChange={(e) =>
                              handleCategoryFieldChange(idx, 'usefulLifeMonths', parseInt(e.target.value, 10))
                            }
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none focus:border-indigo-500"
                          >
                            <option value="12">12m</option>
                            <option value="24">24m</option>
                            <option value="36">36m</option>
                            <option value="48">48m</option>
                            <option value="60">60m</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={cat.requiresCustodySign}
                            onChange={(e) => handleCategoryFieldChange(idx, 'requiresCustodySign', e.target.checked)}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveCategoryRow(idx)}
                            disabled={editableCategories.length <= 1}
                            className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Themes & Branding */}
          {currentStep === 3 && !isCompleted && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-slate-100">Step 3: Workspace Theme & Client Branding</h4>
                <p className="text-xs text-slate-400">
                  Select your workspace UI chromatic vibe and enterprise name.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Workspace Organization Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  placeholder="e.g. Acme Health Corp"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Accent UI Theme</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {themeOptions.map((th) => {
                    const isSelected = selectedTheme === th.id;
                    return (
                      <div
                        key={th.id}
                        onClick={() => setSelectedTheme(th.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-slate-950 border-indigo-500 ring-1 ring-indigo-500/50 shadow'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${th.bg} shadow-md shrink-0`} />
                        <div>
                          <div className="text-xs font-bold text-slate-200">{th.name}</div>
                          <div className="text-[10px] text-slate-500">{th.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Governance Policies */}
          {currentStep === 4 && !isCompleted && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-slate-100">Step 4: Operational Governance Policies</h4>
                <p className="text-xs text-slate-400">
                  Configure compliance rules for physical asset handovers and inventory buffers.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/60 transition">
                  <input
                    type="checkbox"
                    checked={policies.enforceSerialization}
                    onChange={(e) => setPolicies({ ...policies, enforceSerialization: e.target.checked })}
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Enforce Serialized Barcode Tracking</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Requires every inwarded asset to carry a unique serial/QR tag and generates printable PDF certificates.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/60 transition">
                  <input
                    type="checkbox"
                    checked={policies.requireCustodySignOff}
                    onChange={(e) => setPolicies({ ...policies, requireCustodySignOff: e.target.checked })}
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Mandatory Electronic Custody Sign-Off</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Recipients must cryptographically sign upon hardware delivery before the asset status transitions to Active.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/60 transition">
                  <input
                    type="checkbox"
                    checked={policies.realtimeBufferAlerts}
                    onChange={(e) => setPolicies({ ...policies, realtimeBufferAlerts: e.target.checked })}
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Real-Time NOC Buffer Depletion Radar</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Generates high-priority telemetry alerts when inventory counts breach category safety buffers.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/60 transition">
                  <input
                    type="checkbox"
                    checked={policies.autoDepreciationLedger}
                    onChange={(e) => setPolicies({ ...policies, autoDepreciationLedger: e.target.checked })}
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Automated Straight-Line Amortization</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Automatically calculates monthly asset book values based on category useful life and residual salvage percent.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Launch */}
          {currentStep === 5 && !isCompleted && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-slate-100">Step 5: Review Configuration & Initialize Workspace</h4>
                <p className="text-xs text-slate-400">
                  Verify your selections below. Applying will configure your tenant catalog, policies, and dashboard telemetry.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Selected Archetype</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{templates.find((t) => t.id === selectedTemplateId)?.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Configured Categories</span>
                    <p className="font-semibold text-indigo-300 mt-0.5">{editableCategories.length} items</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Theme Style</span>
                    <p className="font-semibold text-slate-200 capitalize mt-0.5">{selectedTheme}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Organization</span>
                    <p className="font-semibold text-slate-200 truncate mt-0.5">{workspaceName}</p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Active Governance Safeguards</span>
                  <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs text-slate-300">
                    <span className="flex items-center text-emerald-400 text-[11px]">
                      <Check className="w-3.5 h-3.5 mr-1" /> Serialized Barcode Ingestion
                    </span>
                    <span className="flex items-center text-emerald-400 text-[11px]">
                      <Check className="w-3.5 h-3.5 mr-1" /> Mandatory Custody Sign-Off
                    </span>
                    <span className="flex items-center text-emerald-400 text-[11px]">
                      <Check className="w-3.5 h-3.5 mr-1" /> Real-time Buffer Telemetry
                    </span>
                    <span className="flex items-center text-emerald-400 text-[11px]">
                      <Check className="w-3.5 h-3.5 mr-1" /> Straight-Line Depreciation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <Rocket className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Workspace Initialized Successfully!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Your tenant inventory master catalog, category buffers, and operational workflows have been activated.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Explore Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        {!isCompleted && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyConfiguration}
                  disabled={isApplying}
                  className="flex items-center space-x-1.5 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>{isApplying ? 'Initializing...' : 'Apply & Launch Workspace'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
