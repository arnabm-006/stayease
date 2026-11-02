import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { DashboardMetrics } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  DollarSign,
  BedDouble,
  CalendarCheck,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<Array<{ date: string; revenue: number }>>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await adminService.getDashboardMetrics();
        setMetrics(res.data.metrics);
        setRevenueTrends(res.data.revenueTrends);
        setRecentBookings(res.data.recentBookings);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-semibold">Aggregating live operational metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-slate-900">Hospitality Command Overview</h2>
        <p className="text-xs text-slate-500">Live operational data, revenue metrics, and room occupancy.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Confirmed Revenue */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Confirmed Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-brand-900">
            {formatCurrency(metrics?.confirmedRevenue || 0)}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold block">
            Net collected from settled stays
          </span>
        </div>

        {/* Occupancy Rate */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Occupancy Rate</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-brand-900">
            {metrics?.occupancyRate || 0}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {metrics?.occupiedRooms} of {metrics?.totalRooms} suites occupied
          </span>
        </div>

        {/* Today's Front Desk Movements */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Today&rsquo;s Front Desk</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-3">
            <div>
              <span className="text-xl font-black text-emerald-700">{metrics?.todayArrivals || 0}</span>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Arrivals</span>
            </div>
            <div className="text-slate-300 font-light text-xl">/</div>
            <div>
              <span className="text-xl font-black text-slate-700">{metrics?.todayDepartures || 0}</span>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Departures</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Expected guest arrivals & departures
          </span>
        </div>

        {/* Room Status Summary */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Room Inventory</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              {metrics?.availableRooms} Available
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
              {metrics?.cleaningRooms} Cleaning
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
              {metrics?.maintenanceRooms} Maint
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Total capacity: {metrics?.totalRooms} rooms
          </span>
        </div>
      </div>

      {/* Chart: Revenue Trends */}
      <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-900">Revenue Performance</h3>
            <p className="text-xs text-slate-400">Daily gross booking value collected</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Past 7 Days
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrends}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(value: any) => [`$${value}`, 'Revenue']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-subtle space-y-4">
        <h3 className="font-serif text-lg font-bold text-brand-900">Recent Guest Reservations</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Reference</th>
                <th className="pb-3 font-semibold">Property</th>
                <th className="pb-3 font-semibold">Dates</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="py-3 font-mono font-bold text-slate-800">{b.bookingReference}</td>
                  <td className="py-3 font-semibold text-slate-800">{b.hotel?.name}</td>
                  <td className="py-3 text-slate-600">
                    {formatDate(b.checkInDate)} &rarr; {formatDate(b.checkOutDate)}
                  </td>
                  <td className="py-3 font-bold text-slate-900">{formatCurrency(b.grandTotal)}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : b.status === 'CHECKED_IN'
                          ? 'bg-blue-50 text-blue-700'
                          : b.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
