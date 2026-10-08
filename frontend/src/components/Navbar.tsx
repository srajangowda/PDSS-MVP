import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Users,
  Calendar,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, loginWithDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const handleRoleSwitch = async (role: 'parent' | 'health_worker' | 'specialist') => {
    setDemoDropdownOpen(false);
    await loginWithDemo(role);
    if (role === 'specialist') {
      navigate('/specialist/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const navLinks = user
    ? user.role === 'specialist'
      ? [
          { name: 'Specialist Hub', path: '/specialist/dashboard', icon: Stethoscope },
          { name: 'Referral Pipeline', path: '/referrals', icon: ClipboardList },
          { name: 'Specialist Directory', path: '/specialists', icon: Users },
        ]
      : [
          { name: 'Dashboard', path: '/dashboard', icon: Activity },
          { name: 'Children', path: '/children', icon: Users },
          { name: 'Referrals', path: '/referrals', icon: ClipboardList },
          { name: 'Follow-ups', path: '/followups', icon: Calendar },
          { name: 'Directory & Camps', path: '/specialists', icon: Stethoscope },
        ]
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={user ? (user.role === 'specialist' ? '/specialist/dashboard' : '/dashboard') : '/'} className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Pedi<span className="text-teal-600">Pulse</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200/60">
                Pre-screening MVP
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 border border-teal-200/70'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Mode Selector */}
            <div className="relative">
              <button
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-sm"
                title="Switch demo persona for testing"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Demo Switcher</span>
                <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
              </button>

              {demoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('parent')}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between"
                  >
                    <span>Parent (Sunita Sharma)</span>
                    {user?.role === 'parent' && <span className="text-[10px] font-bold text-teal-600">Active</span>}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('health_worker')}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between"
                  >
                    <span>Health Worker (ASHA Mary)</span>
                    {user?.role === 'health_worker' && <span className="text-[10px] font-bold text-teal-600">Active</span>}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('specialist')}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between"
                  >
                    <span>Specialist (Dr. Ananya Rao)</span>
                    {user?.role === 'specialist' && <span className="text-[10px] font-bold text-teal-600">Active</span>}
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                  <span className="text-[10px] font-medium text-slate-500 capitalize">{user.role.replace('_', ' ')}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-teal-700 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-teal-600" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

