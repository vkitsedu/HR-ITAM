import React, { useState } from 'react';
import { Shield, Sparkles, Building2, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('hr@acme.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 font-bold text-white text-xl mx-auto">
          EO
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">EmpOps Platform</h1>
        <p className="text-xs text-slate-400">
          Unified Workforce, Smart Attendance, IT Service Desk & Hardware Custody
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Impersonation Cards */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>One-Click Enterprise Demo Accounts:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleSelectRole('hr@acme.com')}
                className={`p-2 rounded-lg border text-left transition ${
                  email === 'hr@acme.com'
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-slate-200">Priya Sharma</div>
                <div className="text-[10px] text-indigo-400">HR Manager</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('it@acme.com')}
                className={`p-2 rounded-lg border text-left transition ${
                  email === 'it@acme.com'
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-slate-200">Rajesh Kumar</div>
                <div className="text-[10px] text-purple-400">IT Manager</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('tech@acme.com')}
                className={`p-2 rounded-lg border text-left transition ${
                  email === 'tech@acme.com'
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-slate-200">Vikram Singh</div>
                <div className="text-[10px] text-blue-400">IT Technician</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('employee@acme.com')}
                className={`p-2 rounded-lg border text-left transition ${
                  email === 'employee@acme.com'
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-slate-200">Rahul Verma</div>
                <div className="text-[10px] text-emerald-400">Senior Engineer</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
