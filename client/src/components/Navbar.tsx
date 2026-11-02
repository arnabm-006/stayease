import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Compass,
  Calendar,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Shield,
  LayoutDashboard,
  Heart,
  Briefcase,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Lock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <>
      {/* Editorial Luxury Top Announcement Bar */}
      <div className="liquid-glass-chip text-slate-200 text-xs py-2 px-4 border-b relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 mx-auto md:mx-0">
            <span className="flex h-2 w-2 relative">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-700"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-600">
              A little something for your next stay: enter{' '}
              <span className="liquid-glass-chip font-mono font-bold text-[#f2dfaa] px-2 py-0.5 rounded border">
                WELCOME10
              </span>{' '}
              for 10% off your first booking
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-6 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1.5 text-slate-600">
              <Compass className="w-3.5 h-3.5 text-emerald-800" />
              <span>Considered stays, thoughtful details</span>
            </span>
            <span className="flex items-center space-x-1.5 text-emerald-800 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure booking</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Frosted Obsidian Header */}
      <header className="royal-nav liquid-glass sticky top-0 z-40 border-b transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Branding */}
            <Link to="/" className="flex items-center space-x-3.5 group">
              <div className="liquid-glass-control relative w-10 h-10 rounded-xl flex items-center justify-center text-white border transition-all duration-300 group-hover:bg-emerald-800">
                <Compass className="w-5 h-5 text-[#d8c49b] transform group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-semibold tracking-tight text-brand-950 transition-colors">
                  Stay<span className="text-gold-leaf font-serif font-black italic ml-0.5">Ease</span>
                </span>
                <span className="text-[8px] tracking-[0.22em] uppercase text-emerald-800 font-semibold -mt-0.5">
                  Stays made personal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link
                to="/hotels"
                className={`px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-bold transition-all duration-200 ${
                  isCurrent('/hotels')
                    ? 'bg-[#edf4ef] text-emerald-900 border border-emerald-800/15'
                      : 'text-slate-600 hover:text-brand-950 hover:bg-slate-50'
                }`}
              >
                Destinations
              </Link>
              <Link
                to="/hotels?sortBy=popularity"
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-semibold text-slate-600 hover:text-brand-950 hover:bg-slate-50 transition-all duration-200"
              >
                Featured Stays
              </Link>
              <Link
                to="/#how-it-works"
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-semibold text-slate-600 hover:text-brand-950 hover:bg-slate-50 transition-all duration-200"
              >
                Our approach
              </Link>
            </nav>

            {/* Right Action CTA & Account */}
            <div className="hidden md:flex items-center space-x-3.5">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="liquid-glass-control flex items-center space-x-2.5 p-1.5 pl-3 pr-2.5 rounded-xl border shadow-sm transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#edf4ef] text-emerald-900 flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                      {user.firstName ? user.firstName[0] : 'U'}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-brand-950 line-clamp-1">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider">
                        {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'HOTEL_MANAGER' ? 'Manager' : user.role === 'RECEPTIONIST' ? 'Staff' : 'VIP Member'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="liquid-glass-panel absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-brand-950">{user.email}</p>
                        <p className="text-[10px] text-emerald-800 font-semibold">Signed in</p>
                      </div>

                      {isStaff ? (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-800" />
                          <span>Management Console</span>
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-emerald-800" />
                          <span>My Reservations</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-wider">
                  <Link
                    to="/login"
                    className="text-slate-700 hover:text-brand-950 px-3 py-2 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {/* High-Impact Gold Foil Action Button */}
              <Link
                to="/hotels"
                className="royal-gold-button inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide shadow-sm transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span>Reserve Suite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-100 text-brand-950 hover:bg-slate-200 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide Drawer */}
        {mobileMenuOpen && (
          <div className="liquid-glass-panel md:hidden border-t px-5 pt-4 pb-6 space-y-3 shadow-lg">
            <Link
              to="/hotels"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Destinations & Sanctuaries
            </Link>
            <Link
              to="/hotels?sortBy=popularity"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Featured Stays
            </Link>

            <div className="pt-3 border-t border-slate-200 flex flex-col space-y-2">
              {isAuthenticated && user ? (
                <>
                  <div className="px-4 py-1 text-xs text-slate-500 font-medium">
                    Signed in as <strong className="text-brand-950">{user.email}</strong>
                  </div>
                  {isStaff ? (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200"
                    >
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200"
                    >
                      My Reservations
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-brand-950"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl text-sm font-semibold bg-brand-950 text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
