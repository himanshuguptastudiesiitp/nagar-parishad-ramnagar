import { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import type { AuthUser, Language } from '../types';
import { apiFetch, setStoredSession } from '../utils/api';

interface StaffLoginModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

const DEMO_ACCOUNTS = [
  { username: 'mukhiya', label: 'Mukhiya (Admin)', name: 'Shri Suresh Prasad Singh' },
  { username: 'sachiv', label: 'Panchayat Sachiv', name: 'Smt. Sangeeta Kumari' },
  { username: 'sarpanch', label: 'Sarpanch (Katchahry)', name: 'Shri Ramashray Mahto' },
  { username: 'ward4', label: 'Ward Member (W-04)', name: 'Smt. Meena Devi' },
];

export function StaffLoginModal({ lang, isOpen, onClose, onSuccess }: StaffLoginModalProps) {
  const [username, setUsername] = useState('mukhiya');
  const [password, setPassword] = useState('Bihar@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setStoredSession(res.token, res.user);
      onSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white border border-slate-200 rounded w-full max-w-md shadow-xl overflow-hidden">
        <div className="bg-[#0B2C59] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF671F]" />
            <h2 className="text-sm font-bold tracking-wide">
              {lang === 'hi' ? 'पंचायत अधिकारी एवं कर्मी लॉगिन' : 'Official Panchayat Staff Login (RBAC)'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-800 rounded" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded">{error}</div>}

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Quick Role Selection (Demo Credentials Pre-filled):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword('Bihar@2026');
                  }}
                  className={`p-2 text-left rounded border text-xs transition-colors ${
                    username === acc.username
                      ? 'border-[#0B2C59] bg-[#0B2C59]/8 text-[#0B2C59]'
                      : 'border-slate-200 hover:border-slate-400 text-slate-700'
                  }`}
                >
                  <div className="font-bold">{acc.label}</div>
                  <div className="text-[11px] text-slate-500 truncate">{acc.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular focus:outline-none focus:border-[#0B2C59]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0B2C59] hover:bg-[#071E3D] text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Sign In to Staff Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
