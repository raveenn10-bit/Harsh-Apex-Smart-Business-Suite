'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCog, Search, Plus, Mail, Phone, Briefcase, 
  Calendar, DollarSign, Shield, Loader2, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Employee {
  id: string;
  employee_id_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string;
  department: string;
  salary: number;
  join_date: string;
  status: string;
  role_name: string | null;
  role_code: string | null;
}

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Add Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Sales & POS');
  const [salary, setSalary] = useState('');
  const [roleCode, setRoleCode] = useState('STAFF');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (deptFilter !== 'all') params.set('department', deptFilter);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/staff?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [deptFilter, search]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          position: position.trim(),
          department,
          salary: Number(salary) || 0,
          role_code: roleCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setPosition('');
        setSalary('');
        await fetchStaff();
      } else {
        alert(data.error || 'Failed to add employee');
      }
    } catch (err) {
      console.error('Failed to register employee:', err);
      alert('Error creating employee record');
    } finally {
      setSubmitting(false);
    }
  };

  // Departments
  const departments = ['all', 'Sales & POS', 'Inventory & Store', 'Operations', 'Finance & Admin'];

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <UserCog className="w-8 h-8 text-blue-600" />
              Staff & Employee Directory
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage internal company users, operational roles, cashier permissions, and compensation.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {departments.map((d) => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  deptFilter === d
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d === 'all' ? 'All Departments' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading employee roster...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="py-16 text-center">
              <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Employees Found</h3>
              <p className="text-sm text-slate-400 mt-1">Add your store clerks, cashiers, or managers to the system.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Name & Position</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Access Role</th>
                    <th className="px-6 py-4 text-right">Base Salary</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">
                        {emp.employee_id_number}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{emp.name}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {emp.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {emp.department}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 space-y-0.5">
                        {emp.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                        {emp.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{emp.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Shield className="w-3 h-3 text-blue-500" />
                          {emp.role_name || emp.role_code || 'Staff'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-xs">
                        Rs. {Number(emp.salary).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          emp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add Employee */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b pb-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add Staff Member</h2>
                  <p className="text-xs text-slate-500">Register employee profile and assign system access role.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kasun Perera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title / Position *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Cashier"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="Sales & POS">Sales & POS</option>
                      <option value="Inventory & Store">Inventory & Store</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance & Admin">Finance & Admin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+94 77 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="kasun@harshapex.lk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Access Role</label>
                    <select
                      value={roleCode}
                      onChange={(e) => setRoleCode(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="CASHIER">Cashier (POS & Invoicing only)</option>
                      <option value="MANAGER">Manager (POS, Inventory, Reports)</option>
                      <option value="STAFF">Staff (General Access)</option>
                      <option value="ADMIN">Admin (Full Operational Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50000"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Employee
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
