import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Shield, 
  UserCircle, 
  Clock, 
  DotsThreeVertical, 
  Download, 
  Plus, 
  MagnifyingGlass,
  Columns,
  CaretUp,
  CaretDown,
  Eye,
  PencilSimple,
  EnvelopeSimple,
  Trash,
  User as UserIcon,
  ShieldChevron,
  IdentificationBadge
} from 'phosphor-react';
import api from '../utils/api';
import AdminModal from '../components/AdminModal';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    admins: 0
  });

  // Modal & Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });

  // Selection States
  const [selectedIds, setSelectedIds] = useState([]);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      const data = res.data.data || [];
      setUsers(data);
      calculateStats(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/admin/users', formData);
      setIsAddModalOpen(false);
      resetForm();
      fetchUsers();
      showToast("User created successfully!");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to add user", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.put(`/admin/users/${selectedUser.id}`, {
        name: formData.name,
        role: formData.role
      });
      setIsEditModalOpen(false);
      fetchUsers();
      showToast("User updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update user", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/admin/users/${selectedUser.id}`);
      setIsDeleteModalOpen(false);
      fetchUsers();
      showToast("User deleted successfully!");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete user", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'customer' });
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
    setActiveDropdown(null);
  };

  // Selection Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/admin/users/${id}`)));
      setSelectedIds([]);
      fetchUsers();
      showToast(`${selectedIds.length} users deleted successfully!`);
    } catch (err) {
      showToast("Failed to delete some users", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Name', 'Email', 'Role', 'Created At'];
      const rows = users.map(u => [u.id, u.name, u.email, u.role, u.created_at]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Export completed!");
    } catch (err) {
      showToast("Export failed", 'error');
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      active: data.filter(u => u.role === 'admin' || u.role === 'active' || u.role === 'customer' || !u.role.includes('pending')).length,
      pending: data.filter(u => u.role === 'waiting' || u.role === 'pending').length,
      admins: data.filter(u => u.role === 'admin').length
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (search) {
      result = result.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, search, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedAndFilteredUsers.length / pageSize);
  const paginatedUsers = sortedAndFilteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getRoleIcon = (role) => {
    switch(role.toLowerCase()) {
      case 'admin': return <Shield size={14} weight="bold" />;
      case 'manager': return <ShieldChevron size={14} weight="bold" />;
      case 'developer': return <IdentificationBadge size={14} weight="bold" />;
      default: return <UserIcon size={14} weight="bold" />;
    }
  };

  const getRoleColors = (role) => {
    switch(role.toLowerCase()) {
      case 'admin': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'manager': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'developer': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in font-sans">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-gray-400 mt-0.5 text-[13px] font-medium">Manage your team members and their account permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all text-[13px] active:scale-95"
            >
              <Download size={16} weight="bold" />
              Export
            </button>
            <button 
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 active:scale-95 text-[13px]"
            >
              <Plus size={16} weight="bold" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UserStatCard 
            label="Total Users" 
            value={stats.total} 
            icon={<Users size={22} weight="fill" />} 
            color="bg-indigo-50 text-indigo-500"
          />
          <UserStatCard 
            label="Active" 
            value={stats.active} 
            icon={<UserCircle size={22} weight="fill" />} 
            color="bg-emerald-50 text-emerald-500"
          />
          <UserStatCard 
            label="Pending" 
            value={stats.pending} 
            icon={<Clock size={22} weight="fill" />} 
            color="bg-amber-50 text-amber-500"
          />
          <UserStatCard 
            label="Admins" 
            value={stats.admins} 
            icon={<Shield size={22} weight="fill" />} 
            color="bg-blue-50 text-blue-500"
          />
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible relative">
          {/* Table Header/Filter */}
          <div className="p-6 pb-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-t-2xl">
            <div className="relative flex-1 max-w-xs">
              <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full pl-11 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-xs font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-gray-600 text-[12px] font-bold hover:bg-gray-50 transition-all shadow-sm bg-white active:scale-95">
              <Columns size={16} weight="bold" />
              Columns
              <CaretDown size={12} weight="bold" className="ml-0.5 opacity-50" />
            </button>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="px-6 py-3 bg-indigo-50 border-y border-indigo-100 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-indigo-700">{selectedIds.length} users selected</span>
                <div className="h-4 w-px bg-indigo-200"></div>
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash size={16} weight="bold" />
                  Delete Selected
                </button>
              </div>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-[10px] uppercase tracking-widest font-black text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* User Table */}
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 w-12 text-center text-[11px]">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                    />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors text-[11px]" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />) : <CaretDown size={12} className="opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors text-[11px]" onClick={() => handleSort('email')}>
                    <div className="flex items-center gap-2">
                      Email {sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />) : <CaretDown size={12} className="opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors text-[11px]" onClick={() => handleSort('role')}>
                    <div className="flex items-center gap-2">
                      Role {sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />) : <CaretDown size={12} className="opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[11px]">Status</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors text-[11px]" onClick={() => handleSort('last_login')}>
                    <div className="flex items-center gap-2">
                      Last Login {sortConfig.key === 'last_login' ? (sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />) : <CaretDown size={12} className="opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-gray-400 font-medium">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-sm font-bold opacity-60">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-gray-400 font-medium not-italic">
                      <Users size={48} className="mx-auto mb-4 opacity-20" />
                      <span className="text-base font-bold">No users found matching your search.</span>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50/80 transition-all group not-italic relative ${selectedIds.includes(user.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-5 w-12 text-center rounded-l-2xl transition-colors bg-white group-hover:bg-transparent">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer" 
                          checked={selectedIds.includes(user.id)}
                          onChange={() => handleSelectOne(user.id)}
                        />
                      </td>
                      <td className="px-6 py-5 bg-white group-hover:bg-transparent">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-[13px] shadow-sm border-2 border-white transition-transform group-hover:scale-110 ${
                            user.id % 4 === 0 ? 'bg-indigo-100 text-indigo-700' :
                            user.id % 4 === 1 ? 'bg-emerald-100 text-emerald-700' :
                            user.id % 4 === 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900 leading-tight">{user.name}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-0.5">USR-{String(user.id).padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-bold bg-white group-hover:bg-transparent">{user.email}</td>
                      <td className="px-6 py-5 bg-white group-hover:bg-transparent">
                        <span className={`px-4 py-1.5 border rounded-full text-[11px] font-black flex items-center gap-2 w-fit uppercase tracking-wider ${getRoleColors(user.role)}`}>
                          <span className="opacity-70">{getRoleIcon(user.role)}</span>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 bg-white group-hover:bg-transparent">
                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                          (user.role !== 'waiting' && user.role !== 'pending')
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-500'
                        }`}>
                          {(user.role !== 'waiting' && user.role !== 'pending') ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600 font-bold bg-white group-hover:bg-transparent">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : (user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Never')}
                      </td>
                      <td className="px-6 py-5 text-right rounded-r-2xl bg-white group-hover:bg-transparent">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === user.id ? null : user.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all active:scale-90"
                          >
                            <DotsThreeVertical size={20} weight="bold" />
                          </button>
                          
                          {activeDropdown === user.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveDropdown(null)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-[1.5rem] bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none z-20 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="py-2">
                                  <DropdownItem icon={<Eye size={18} />} label="View Details" onClick={() => openViewModal(user)} />
                                  <DropdownItem icon={<PencilSimple size={18} />} label="Edit User" onClick={() => openEditModal(user)} />
                                  <DropdownItem icon={<EnvelopeSimple size={18} />} label="Send Email" onClick={() => setActiveDropdown(null)} />
                                  <div className="h-px bg-gray-50 my-1"></div>
                                  <DropdownItem icon={<Trash size={18} />} label="Delete" color="text-red-600 hover:bg-red-50" onClick={() => openDeleteModal(user)} />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white rounded-b-[2.5rem]">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * pageSize, sortedAndFilteredUsers.length)}</span> of <span className="text-gray-900">{sortedAndFilteredUsers.length}</span> results
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-100 rounded-lg text-[11px] font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95"
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all active:scale-90 ${
                    currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-100 rounded-lg text-[11px] font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals outside the animated div */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User"
        footer={(
          <>
            <button 
              onClick={() => setIsAddModalOpen(false)} 
              className="px-10 py-2.5 text-sm font-bold text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-all"
            >
              Cancel
            </button>
            <button 
              form="add-user-form"
              type="submit" 
              disabled={isSubmitting}
              className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 text-sm"
            >
              {isSubmitting ? 'Creating...' : 'Add User'}
            </button>
          </>
        )}
      >
        <form id="add-user-form" onSubmit={handleAddUser} className="space-y-3">
          <FormGroup label="Full Name" placeholder="e.g. John Doe" value={formData.name} onChange={(val) => setFormData({...formData, name: val})} />
          <FormGroup label="Email Address" type="email" placeholder="john@example.com" value={formData.email} onChange={(val) => setFormData({...formData, email: val})} />
          <FormGroup label="Initial Password" type="password" placeholder="••••••••" value={formData.password} onChange={(val) => setFormData({...formData, password: val})} />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Role</label>
            <div className="relative">
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium text-gray-800 appearance-none cursor-pointer"
              >
                <option value="customer">Customer</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <CaretDown size={14} weight="bold" />
              </div>
            </div>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        footer={(
          <>
            <button 
              onClick={() => setIsEditModalOpen(false)} 
              className="px-10 py-2.5 text-sm font-bold text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-all"
            >
              Cancel
            </button>
            <button 
              form="edit-user-form"
              type="submit" 
              disabled={isSubmitting}
              className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 text-sm"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </>
        )}
      >
        <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-3">
          <FormGroup label="Full Name" value={formData.name} onChange={(val) => setFormData({...formData, name: val})} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email Address (Locked)</label>
            <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 text-sm font-medium">
              {formData.email}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Role</label>
            <div className="relative">
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium text-gray-800 appearance-none cursor-pointer"
              >
                <option value="customer">Customer</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <CaretDown size={14} weight="bold" />
              </div>
            </div>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        variant="centered"
        size="sm"
        footer={(
          <>
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-all">Cancel</button>
            <button 
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm shadow-red-100 disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Delete User'}
            </button>
          </>
        )}
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash size={40} weight="fill" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h3>
          <p className="text-gray-500">You are about to delete <span className="font-bold text-gray-900">{selectedUser?.name}</span>. This action cannot be undone.</p>
        </div>
      </AdminModal>

      <AdminModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details"
        size="md"
        footer={(
          <button 
            onClick={() => setIsViewModalOpen(false)} 
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 text-sm"
          >
            Close
          </button>
        )}
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl shadow-inner border-4 border-white ${getRoleColors(selectedUser.role)}`}>
                {getInitials(selectedUser.name)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{selectedUser.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleColors(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">Joined {new Date(selectedUser.created_at || selectedUser.CreatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4">
              <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Information</h5>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                <DetailRow label="User ID" value={`USR-${String(selectedUser.id).padStart(3, '0')}`} highlight />
                <DetailRow label="Email Address" value={selectedUser.email} copyable />
                <DetailRow label="Phone Number" value={selectedUser.phone || 'Not provided'} />
                <DetailRow label="Last Login" value={selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'} />
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4">
              <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Location Details</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Province</p>
                  <p className="text-sm font-semibold text-gray-700">{selectedUser.province || '-'}</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">City</p>
                  <p className="text-sm font-semibold text-gray-700">{selectedUser.city || '-'}</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">District</p>
                  <p className="text-sm font-semibold text-gray-700">{selectedUser.district || '-'}</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Postal Code</p>
                  <p className="text-sm font-semibold text-gray-700">{selectedUser.postal_code || '-'}</p>
                </div>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Full Address</p>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed">{selectedUser.full_address || 'No address registered'}</p>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 font-bold text-sm ${
          toast.type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-red-600 border-red-100'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            toast.type === 'success' ? 'bg-emerald-50' : 'bg-red-50'
          }`}>
            {toast.type === 'success' ? <Shield size={18} weight="fill" /> : <Trash size={18} weight="fill" />}
          </div>
          {toast.message}
        </div>
      )}
    </>
  );
};

const FormGroup = ({ label, type = "text", placeholder, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500 ml-1">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300"
      required
    />
  </div>
);

const DetailRow = ({ label, value, highlight = false, copyable = false }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-2">
      <span className={`text-[13px] font-bold ${highlight ? 'text-blue-600 font-mono' : 'text-gray-700'}`}>{value}</span>
    </div>
  </div>
);

const UserStatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-5 rounded-[1.25rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-500">
    <div className="space-y-0.5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:rotate-3`}>
      {icon}
    </div>
  </div>
);

const DropdownItem = ({ icon, label, onClick, color = "text-gray-700 hover:bg-gray-50" }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-bold transition-colors ${color}`}
  >
    <span className="opacity-60">{icon}</span>
    {label}
  </button>
);

export default AdminUsers;
