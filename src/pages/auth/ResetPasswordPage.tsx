import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, Search, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const { resetPassword, setNewPassword, session } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const isRecoveryFlow = typeof window !== 'undefined' && (
      window.location.hash.includes('type=recovery') ||
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('refresh_token') ||
      !!session
    );
    setShowPasswordForm(isRecoveryFlow);
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      notify(error, 'error');
    } else {
      setSent(true);
      notify('Password reset email sent');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      notify('Password must be at least 8 characters long.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await setNewPassword(password);
    setLoading(false);

    if (error) {
      notify(error, 'error');
      return;
    }

    notify('Password updated successfully');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Reclaim</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {showPasswordForm ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Set a new password</h2>
              <p className="text-slate-500 mb-6">Choose a strong password for your account.</p>

              <form onSubmit={handlePasswordUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                      placeholder="At least 8 characters"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </>
          ) : sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-brand-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 mb-6">
                We sent a password reset link to <span className="font-medium text-slate-700">{email}</span>.
                Follow the link in the email to reset your password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset your password</h2>
              <p className="text-slate-500 mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
