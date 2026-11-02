import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Compass,
  LayoutDashboard,
  Building2,
  BedDouble,
  CalendarCheck,
  Sparkles,
  Tag,
  Users,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout, isStaff, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center shadow-lg border border-slate-100">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Restricted Access</h2>
          <p className="text-sm text-slate-500 mb-6">
            You do not have staff permissions to view the Hotel Administration Portal. Please sign in with staff or manager credentials.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-2.5 rounded-xl bg-brand-900 text-white font-semibold text-sm hover:bg-brand-800"
            >
              Sign In as Staff
            </Link>
            <Link
              to="/"
              className="block w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    ...(isAdmin ? [{ label: 'Properties', path: '/admin/hotels', icon: Building2 }] : []),
    { label: 'Rooms & Inventory', path: '/admin/rooms', icon: BedDouble },
    { label: 'Reservations & Desk', path: '/admin/bookings', icon: CalendarCheck },
    { label: 'Housekeeping', path: '/admin/housekeeping', icon: Sparkles },
    { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    ...(isAdmin ? [{ label: 'Staff Management', path: '/admin/staff', icon: Users }] : []),
  ];

  const isCurrent = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="royal-atmosphere min-h-screen flex">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-brand-950 text-slate-300 transition-all duration-300 z-40 border-r border-brand-900 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-brand-900">
          {!collapsed && (
            <Link to="/admin" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-white tracking-tight">StayEase</span>
                <span className="text-[9px] tracking-widest uppercase text-emerald-400 font-bold -mt-0.5">
                  Staff Portal
                </span>
              </div>
            </Link>
          )}

          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto">
              <Compass className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-brand-900 transition-colors hidden lg:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Assigned Hotel Scope Badge */}
        {!collapsed && user?.assignedHotel && (
          <div className="px-5 py-3 mx-3 my-3 rounded-xl bg-brand-900/60 border border-brand-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Assigned Hotel
            </span>
            <span className="font-semibold text-white truncate block">
              {user.assignedHotel.name}
            </span>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-brand-900'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User and bottom actions */}
        <div className="p-4 border-t border-brand-900 space-y-2">
          <Link
            to="/"
            target="_blank"
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-brand-900 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Open Customer Website"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Public Website</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="liquid-glass royal-nav h-20 border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Management Dashboard</h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                StayEase Hospitality Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-xs font-bold">
                {user?.firstName?.charAt(0)}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-5 sm:p-6 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
