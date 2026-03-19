import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { Users, Package, Receipt, CheckCircle, Tag, Truck } from 'phosphor-react';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({
      pending_users: 0,
      total_products: 0,
      total_orders: 0,
      active_promos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
          api.get('/admin/users/pending'),
          api.get('/admin/stats')
      ]);
      setPendingUsers(usersRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/approve`);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      setStats(prev => ({ ...prev, pending_users: prev.pending_users - 1 }));
      alert("User approved successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve user");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users size={28} weight="fill" />} 
          label="Pending Users" 
          value={stats.pending_users} 
          color="bg-orange-50 text-orange-600 border-orange-100" 
        />
        <StatCard 
          icon={<Package size={28} weight="fill" />} 
          label="Total Products" 
          value={stats.total_products} 
          color="bg-indigo-50 text-indigo-600 border-indigo-100" 
        />
        <StatCard 
          icon={<Receipt size={28} weight="fill" />} 
          label="Total Orders" 
          value={stats.total_orders} 
          color="bg-emerald-50 text-emerald-600 border-emerald-100" 
        />
        <StatCard 
          icon={<CheckCircle size={28} weight="fill" />} 
          label="Active Promos" 
          value={stats.active_promos} 
          color="bg-purple-50 text-purple-600 border-purple-100" 
        />
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-lg font-bold text-gray-900">Pending Approvals</h3>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve new merchant registrations</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Register Date</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">Loading pending users...</td></tr>
              ) : pendingUsers.length === 0 ? (
                 <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No users awaiting approval.</td></tr>
              ) : (
                pendingUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.CreatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                         {user.role}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => approveUser(user.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-indigo-200 active:scale-95"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-all duration-300 group">
    <div className={`p-4 rounded-xl border ${color} transition-transform group-hover:scale-110 duration-300`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;
