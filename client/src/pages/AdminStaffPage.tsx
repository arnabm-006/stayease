import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { User, Hotel } from '../types';
import { Users, Plus, Shield, Mail, Phone, X } from 'lucide-react';
import { formatDate } from '../lib/utils';

export const AdminStaffPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Staff@123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('RECEPTIONIST');
  const [hotelId, setHotelId] = useState('');

  useEffect(() => {
    loadUsersAndHotels();
  }, []);

  const loadUsersAndHotels = async () => {
    setLoading(true);
    try {
      const [usersRes, hotelsRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getHotels(),
      ]);
      setUsers(usersRes.data.users);
      setHotels(hotelsRes.data.hotels);
      if (hotelsRes.data.hotels[0]) {
        setHotelId(hotelsRes.data.hotels[0].id);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createStaff({
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        hotelId: role === 'SUPER_ADMIN' ? null : hotelId,
      });

      setModalOpen(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      await loadUsersAndHotels();
    } catch (err: any) {
      alert(err?.message || 'Failed to provision staff account.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Staff & Account Management</h2>
          <p className="text-xs text-slate-500">
            Provision desk receptionists, property managers, and view customer accounts.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Staff Member</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Assigned Property</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 text-sm block">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'HOTEL_MANAGER'
                          ? 'bg-brand-50 text-brand-900 border border-brand-200'
                          : u.role === 'RECEPTIONIST'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">
                    {u.assignedHotel?.name || (u.role === 'SUPER_ADMIN' ? 'All Properties' : 'None')}
                  </td>
                  <td className="p-4 text-slate-500">
                    <div>{u.phone || 'No phone'}</div>
                  </td>
                  <td className="p-4 text-slate-400">
                    {u.createdAt ? formatDate(u.createdAt) : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">Provision Staff Account</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                  >
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="HOTEL_MANAGER">Hotel Manager</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>

                {role !== 'SUPER_ADMIN' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Assign Property
                    </label>
                    <select
                      value={hotelId}
                      onChange={(e) => setHotelId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                    >
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
