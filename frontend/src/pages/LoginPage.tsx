import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, ArrowRight, ShieldCheck, Users, HeartHandshake, Stethoscope } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithSupabase, loginWithDemo, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginWithSupabase(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  const handleDemoLogin = async (role: 'parent' | 'health_worker' | 'specialist') => {
    setError(null);
    try {
      await loginWithDemo(role);
      if (role === 'specialist') {
        navigate('/specialist/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
          <Activity className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back to PediPulse</h1>
        <p className="text-xs text-slate-500">Sign in to your developmental screening dashboard</p>
      </div>

      {/* Demo Persona Box for Evaluators */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Evaluation Demo Personas
          </span>
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/50 px-2 py-0.5 rounded-full">
            Instant Login
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleDemoLogin('parent')}
            className="p-2.5 bg-white hover:bg-teal-50 border border-amber-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition flex flex-col items-center gap-1 shadow-2xs"
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>Parent</span>
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('health_worker')}
            className="p-2.5 bg-white hover:bg-teal-50 border border-amber-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition flex flex-col items-center gap-1 shadow-2xs"
          >
            <HeartHandshake className="w-4 h-4 text-teal-600" />
            <span>Health Worker</span>
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('specialist')}
            className="p-2.5 bg-white hover:bg-teal-50 border border-amber-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition flex flex-col items-center gap-1 shadow-2xs"
          >
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span>Specialist</span>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 underline">
            Register for PediPulse
          </Link>
        </div>
      </div>
    </div>
  );
};

