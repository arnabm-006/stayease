import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Room, Hotel } from '../types';
import { formatCurrency } from '../lib/utils';
import { BedDouble, Plus, Sparkles, AlertTriangle, CheckCircle2, Wrench, X } from 'lucide-react';

export const AdminRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add Room Modal
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [newRoomHotelId, setNewRoomHotelId] = useState('');
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [savingRoom, setSavingRoom] = useState(false);

  // Add Room Type Modal
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typePrice, setTypePrice] = useState(300);
  const [typeMaxOcc, setTypeMaxOcc] = useState(2);
  const [typeBed, setTypeBed] = useState('1 King Bed');
  const [typeSize, setTypeSize] = useState(450);

  useEffect(() => {
    loadHotelsAndRooms();
  }, [selectedHotelId, statusFilter]);

  const loadHotelsAndRooms = async () => {
    setLoading(true);
    try {
      const [hotelsRes, roomsRes] = await Promise.all([
        adminService.getHotels(),
        adminService.getRooms({
          hotelId: selectedHotelId || undefined,
          status: statusFilter || undefined,
        }),
      ]);
      setHotels(hotelsRes.data.hotels);
      setRooms(roomsRes.data.rooms);

      if (!newRoomHotelId && hotelsRes.data.hotels[0]) {
        setNewRoomHotelId(hotelsRes.data.hotels[0].id);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (roomId: string, newStatus: string) => {
    try {
      await adminService.updateRoom(roomId, { status: newStatus });
      await loadHotelsAndRooms();
    } catch (err: any) {
      alert(err?.message || 'Failed to update room status.');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRoom(true);
    try {
      await adminService.createRoom({
        hotelId: newRoomHotelId,
        roomTypeId: newRoomTypeId,
        roomNumber: newRoomNumber,
        floor: newRoomFloor,
      });
      setAddRoomOpen(false);
      setNewRoomNumber('');
      await loadHotelsAndRooms();
    } catch (err: any) {
      alert(err?.message || 'Failed to create room.');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createRoomType({
        hotelId: newRoomHotelId,
        name: typeName,
        description: typeDesc,
        basePrice: typePrice,
        maxOccupancy: typeMaxOcc,
        bedConfig: typeBed,
        roomSizeSqFt: typeSize,
      });
      setAddTypeOpen(false);
      setTypeName('');
      setTypeDesc('');
      await loadHotelsAndRooms();
    } catch (err: any) {
      alert(err?.message || 'Failed to create room type.');
    }
  };

  const activeHotelRoomTypes =
    hotels.find((h) => h.id === newRoomHotelId)?.roomTypes || [];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Rooms & Inventory</h2>
          <p className="text-xs text-slate-500">Configure physical rooms, floors, and room types.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAddTypeOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>New Suite Category</span>
          </button>

          <button
            onClick={() => setAddRoomOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Physical Room</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-subtle flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Filter by Property
          </label>
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="">All Managed Properties</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Room Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="CLEANING">Cleaning / Housekeeping</option>
            <option value="MAINTENANCE">Under Maintenance</option>
          </select>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-4">Room #</th>
                <th className="p-4">Floor</th>
                <th className="p-4">Suite Category</th>
                <th className="p-4">Base Rate</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Status Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/60">
                  <td className="p-4 font-mono font-bold text-slate-900 text-sm">
                    {room.roomNumber}
                  </td>
                  <td className="p-4 text-slate-600">Floor {room.floor}</td>
                  <td className="p-4 font-semibold text-slate-800">
                    {room.roomType?.name}
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {formatCurrency(room.roomType?.basePrice || 0)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        room.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : room.status === 'OCCUPIED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : room.status === 'CLEANING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {room.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={room.status}
                      onChange={(e) => handleUpdateStatus(room.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px] font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="AVAILABLE">Set Available</option>
                      <option value="OCCUPIED">Set Occupied</option>
                      <option value="CLEANING">Set Cleaning</option>
                      <option value="MAINTENANCE">Set Maintenance</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Room Modal */}
      {addRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">Add Physical Room</h3>
              <button onClick={() => setAddRoomOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Property
                </label>
                <select
                  value={newRoomHotelId}
                  onChange={(e) => setNewRoomHotelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Suite Type
                </label>
                <select
                  value={newRoomTypeId}
                  onChange={(e) => setNewRoomTypeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="">Select Suite Type</option>
                  {activeHotelRoomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({formatCurrency(rt.basePrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="e.g. 401"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Floor
                  </label>
                  <input
                    type="number"
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddRoomOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoom}
                  className="px-5 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 disabled:opacity-50"
                >
                  {savingRoom ? 'Saving...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Type Modal */}
      {addTypeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">New Suite Category</h3>
              <button onClick={() => setAddTypeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoomType} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Royal Penthouse Villa"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={typeDesc}
                  onChange={(e) => setTypeDesc(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Base Rate ($)
                  </label>
                  <input
                    type="number"
                    value={typePrice}
                    onChange={(e) => setTypePrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Max Occupancy
                  </label>
                  <input
                    type="number"
                    value={typeMaxOcc}
                    onChange={(e) => setTypeMaxOcc(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddTypeOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
