import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Compass, AlertCircle, ArrowRight, UserCheck, Shield, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate(redirect);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: string, demoEmail: string, demoPass: string) => {
    setSelectedDemo(role);
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div className="liquid-glass-panel mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_-28px_rgba(15,36,56,0.28)] lg:min-h-[680px] lg:grid-cols-[1.02fr_0.98fr]">
        <aside className="relative min-h-[260px] overflow-hidden bg-brand-950 sm:min-h-[340px] lg:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85"
            alt="Sunlit, thoughtfully designed hotel room"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071521]/95 via-[#071521]/35 to-[#071521]/10" />
          <div className="absolute left-6 top-6 sm:left-9 sm:top-9">
            <Link to="/" className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-black/15 px-3.5 py-2 text-white backdrop-blur-md">
              <Compass className="h-5 w-5 text-emerald-300" />
              <span className="font-serif text-lg font-semibold tracking-tight">StayEase</span>
            </Link>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9 lg:p-11">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              YOUR NEXT STAY, MADE SIMPLE
            </span>
            <h1 className="max-w-md font-serif text-3xl leading-tight sm:text-4xl lg:text-[2.8rem]">
              A little closer to <span className="italic text-emerald-200">somewhere special.</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">
              Sign in to find your reservations and plan the details of your next getaway.
            </p>
          </div>
        </aside>

        <section className="flex items-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
          <div className="mx-auto w-full max-w-md space-y-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Welcome back</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">Sign in to StayEase</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Use your email and password to continue.</p>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-800">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSelectedDemo(null); }}
                  placeholder="you@example.com"
                  required
                  className="auth-input w-full rounded-xl border border-slate-300 px-4 py-3.5 text-sm shadow-sm transition placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-700/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="text-sm font-semibold text-slate-800">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setSelectedDemo(null); }}
                    placeholder="Enter your password"
                    required
                    className="auth-input w-full rounded-xl border border-slate-300 px-4 py-3.5 pr-12 text-sm shadow-sm transition placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-700/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-4 text-slate-500 transition hover:text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="royal-gold-button group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-[0_8px_18px_-8px_rgba(10,22,36,0.65)] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/25 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>OR TRY A DEMO ACCOUNT</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { role: 'Customer', email: 'customer@stayease.com', password: 'Customer@123', icon: UserCheck },
                { role: 'Front desk', email: 'receptionist@stayease.com', password: 'Staff@123', icon: Shield },
                { role: 'Hotel manager', email: 'manager@stayease.com', password: 'Manager@123', icon: Compass },
                { role: 'Administrator', email: 'admin@stayease.com', password: 'Admin@123', icon: Shield },
              ].map((demo) => {
                const Icon = demo.icon;
                const isSelected = selectedDemo === demo.role;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleQuickLogin(demo.role, demo.email, demo.password)}
                    className={`flex min-h-[54px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/15 ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700/50 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-emerald-800' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">{demo.role}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5 text-emerald-800" />
              <span>Your account details are protected.</span>
            </div>

            <p className="text-center text-sm text-slate-600">
              New to StayEase?{' '}
              <Link to="/register" className="font-semibold text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
