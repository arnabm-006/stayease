import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Room } from '../types';
import { Sparkles, Wrench, CheckCircle2, Clock, Plus, X } from 'lucide-react';

export const AdminHousekeepingPage: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Maintenance Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );

  useEffect(() => {
    loadHousekeepingData();
  }, []);

  const loadHousekeepingData = async () => {
    setLoading(true);
    try {
      const [houseRes, maintRes] = await Promise.all([
        adminService.getHousekeeping(),
        adminService.getMaintenance(),
      ]);
      setRooms(houseRes.data.rooms);
      setMaintenanceList(maintRes.data.maintenance);
    } catch (err) {
      console.error('Failed to load housekeeping data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkClean = async (roomId: string) => {
    try {
      await adminService.updateRoomCleaningStatus(roomId, 'AVAILABLE');
      await loadHousekeepingData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update cleaning status.');
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.scheduleMaintenance({
        roomId: selectedRoomId,
        hotelId: selectedHotelId,
        title,
        description,
        priority,
        startDate,
        endDate,
      });
      setScheduleModalOpen(false);
      await loadHousekeepingData();
    } catch (err: any) {
      alert(err?.message || 'Failed to schedule maintenance.');
    }
  };

  const handleUpdateMaintenanceStatus = async (id: string, status: string) => {
    try {
      await adminService.updateMaintenanceStatus(id, status);
      await loadHousekeepingData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update maintenance.');
    }
  };

  const cleaningRooms = rooms.filter((r) => r.status === 'CLEANING');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold text-slate-900">
          Housekeeping & Maintenance
        </h2>
        <p className="text-xs text-slate-500">
          Manage room turnover cleaning and schedule engineering maintenance.
        </p>
      </div>

      {/* Housekeeping Turnover Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Rooms Awaiting Housekeeping ({cleaningRooms.length})
            </h3>
          </div>
        </div>

        {cleaningRooms.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">All guest suites are currently sanitized and ready.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cleaningRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-base font-extrabold text-slate-900">
                    Suite {room.roomNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Floor {room.floor} &bull; {room.roomType?.name}
                  </span>
                </div>

                <button
                  onClick={() => handleMarkClean(room.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Clean</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-rose-600" />
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Maintenance & Repairs ({maintenanceList.length})
            </h3>
          </div>

          <button
            onClick={() => {
              if (rooms[0]) {
                setSelectedRoomId(rooms[0].id);
                setSelectedHotelId(rooms[0].hotelId);
              }
              setScheduleModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Maintenance</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-3">Room</th>
                <th className="p-3">Task Title</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Scheduled Dates</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenanceList.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-slate-800">
                    Room #{m.room?.roomNumber}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{m.title}</span>
                    <span className="text-[11px] text-slate-400">{m.description}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                      {m.priority}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">
                    {new Date(m.startDate).toLocaleDateString()} &rarr; {new Date(m.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 font-semibold text-slate-700">{m.status}</td>
                  <td className="p-3 text-right">
                    {m.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateMaintenanceStatus(m.id, 'COMPLETED')}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                      >
                        Complete & Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">Schedule Room Maintenance</h3>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Room
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    const r = rooms.find((x) => x.id === e.target.value);
                    if (r) setSelectedHotelId(r.hotelId);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room #{r.roomNumber} - {r.hotel?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Air conditioning filter inspection"
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                >
                  Schedule & Lock Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
