'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCog, Clock, Calendar, CheckCircle, XCircle, AlertCircle,
  Plus, Check, X, Loader2, UserCheck, Shield
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface AttendanceRecord {
  id: string | null;
  work_date: string | null;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  notes: string | null;
  employee_id: string;
  employee_name: string;
  employee_id_number: string;
  position: string;
  department: string;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at: string;
  employee_name: string;
  employee_id_number: string;
  position: string;
  department: string;
  approved_by_name: string | null;
}

interface EmployeeOption {
  id: string;
  name: string;
  employee_id_number: string;
}

export default function HRPage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Clock Station
  const [clockEmployeeId, setClockEmployeeId] = useState('');
  const [clockAction, setClockAction] = useState<'check_in' | 'check_out'>('check_in');
  const [clocking, setClocking] = useState(false);
  const [clockMsg, setClockMsg] = useState<string | null>(null);

  // Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/staff/attendance?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setAttendance(data.attendance || []);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await fetch('/api/staff/leaves');
      const data = await res.json();
      if (data.success) {
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
    }
  };

  const fetchStaffOptions = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        if (data.employees?.length > 0 && !clockEmployeeId) {
          setClockEmployeeId(data.employees[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load employees for clocking:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAttendance(), fetchLeaves(), fetchStaffOptions()]);
      setLoading(false);
    };
    init();
  }, [selectedDate]);

  const handleClock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockEmployeeId) return;

    try {
      setClocking(true);
      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: clockEmployeeId,
          action: clockAction,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setClockMsg(data.message);
        await fetchAttendance();
        setTimeout(() => setClockMsg(null), 4000);
      } else {
        alert(data.error || 'Clocking error');
      }
    } catch (err) {
      console.error('Clocking error:', err);
    } finally {
      setClocking(false);
    }
  };

  const handleLeaveDecision = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/staff/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeaves();
      }
    } catch (err) {
      console.error('Failed to update leave:', err);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmpId || !startDate || !endDate) return;

    try {
      setSubmittingLeave(true);
      const res = await fetch('/api/staff/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: leaveEmpId,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: leaveReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsLeaveModalOpen(false);
        setLeaveReason('');
        await fetchLeaves();
      }
    } catch (err) {
      console.error('Failed to submit leave:', err);
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <UserCog className="w-8 h-8 text-purple-600" />
              Advanced HR & Clock-in Station
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Time attendance clocking, shift logs, and staff leave approval workflows.
            </p>
          </div>

          <button
            onClick={() => {
              if (employees.length > 0 && !leaveEmpId) setLeaveEmpId(employees[0].id);
              setIsLeaveModalOpen(true);
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Apply Leave
          </button>
        </div>

        {/* Live Clock-in Terminal Card */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-purple-200 border border-white/10 inline-block mb-1">
              Active Shift Kiosk
            </span>
            <h2 className="text-xl font-bold">Staff Digital Time-Clock</h2>
            <p className="text-xs text-purple-200 max-w-md">
              Cashiers and shop associates can record their shift start and end times instantly.
            </p>
          </div>

          <form onSubmit={handleClock} className="flex flex-wrap items-center gap-3 bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
            <select
              value={clockEmployeeId}
              onChange={(e) => setClockEmployeeId(e.target.value)}
              className="text-xs p-2.5 bg-slate-900 text-white rounded-xl border border-white/20 focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id_number})
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={clocking}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {clocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              Punch Attendance
            </button>
          </form>
        </div>

        {clockMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{clockMsg}</span>
          </div>
        )}

        {/* Attendance Register Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Daily Attendance Register
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Verified daily check-ins and check-outs</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : attendance.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No active employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {attendance.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {rec.employee_name}
                        <span className="text-[11px] text-slate-400 font-mono block">{rec.employee_id_number}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{rec.department}</td>
                      <td className="px-4 py-3 font-mono text-slate-800">
                        {rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-800">
                        {rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rec.check_in
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {rec.check_in ? 'Present' : 'Not Clocked In'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leave Requests Management */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Staff Leave Applications
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Review, approve, or reject employee time off</p>
            </div>
          </div>

          {leaves.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No leave requests logged.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {l.employee_name}
                      </td>
                      <td className="px-4 py-3 capitalize text-purple-700 font-medium">{l.leave_type}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                        {l.reason || 'No details provided'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          l.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : l.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {l.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleLeaveDecision(l.id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(l.id, 'rejected')}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Decision Recorded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Request Leave */}
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h2 className="text-lg font-bold text-slate-900">Apply Leave Request</h2>
                <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitLeave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
                  <select
                    value={leaveEmpId}
                    onChange={(e) => setLeaveEmpId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="medical">Medical / Sick Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                  <textarea
                    rows={2}
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Brief description of leave request..."
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsLeaveModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLeave}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {submittingLeave && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
