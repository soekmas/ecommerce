import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tag, 
  Plus, 
  MagnifyingGlass,
  Columns,
  CaretUp,
  CaretDown,
  DotsThreeVertical, 
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  Selection,
  Shield,
  Warning
} from 'phosphor-react';
import api from '../utils/api';
import AdminModal from '../components/AdminModal';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    slug: '',
    is_active: true
  });

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/catalog/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', slug: '', is_active: true });
    setSelectedCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      is_active: category.is_active ?? true
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (formData.id) {
        await api.put(`/admin/categories/${formData.id}`, formData);
        showToast("Category updated successfully!");
      } else {
        await api.post('/admin/categories', formData);
        showToast("Category created successfully!");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || err.response?.data?.error || "Failed to save category", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/admin/categories/${selectedCategory.id}`);
      setIsDeleteModalOpen(false);
      fetchCategories();
      showToast("Category deleted successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete category", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredCategories = useMemo(() => {
    let result = [...categories];

    // Search
    if (search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.slug.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
      const bValue = (b[sortConfig.key] || '').toString().toLowerCase();
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [categories, search, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedAndFilteredCategories.length / pageSize);
  const paginatedCategories = sortedAndFilteredCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in font-sans">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Category Management</h1>
            <p className="text-gray-400 mt-1 text-[13px] font-medium">Structure your store products with organized categories</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 active:scale-95 text-sm"
          >
            <Plus size={18} weight="bold" />
            New Category
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-visible relative">
          {/* Table Header/Filter */}
          <div className="p-6 pb-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-t-[2rem]">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search categories..." 
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
               <button className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-gray-600 text-[12px] font-bold hover:bg-gray-50 transition-all shadow-sm bg-white active:scale-95">
                <Columns size={16} weight="bold" />
                Columns
                <CaretDown size={12} weight="bold" className="ml-0.5 opacity-50" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      Category Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />) : <CaretDown size={12} className="opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('slug')}>
                    <div className="flex items-center gap-2">
                      Slug {sortConfig.key === 'slug' ? (sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />) : <CaretDown size={12} className="opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-sm font-bold opacity-60">Loading categories...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-gray-400 font-medium">
                      <Selection size={48} className="mx-auto mb-4 opacity-20" />
                      <span className="text-base font-bold">No categories found matching your search.</span>
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50/80 transition-all group relative">
                      <td className="px-6 py-4 bg-white rounded-l-2xl group-hover:bg-transparent">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[13px] shadow-sm border-2 border-white transition-transform group-hover:scale-110 ${
                            category.id % 4 === 0 ? 'bg-indigo-100 text-indigo-700' :
                            category.id % 4 === 1 ? 'bg-emerald-100 text-emerald-700' :
                            category.id % 4 === 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getInitials(category.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900 leading-tight">{category.name}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">CAT-{String(category.id).padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium bg-white group-hover:bg-transparent whitespace-nowrap">
                        <span className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 font-mono text-xs">/{category.slug}</span>
                      </td>
                      <td className="px-6 py-4 bg-white group-hover:bg-transparent">
                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black flex items-center gap-2 w-fit uppercase tracking-wider ${
                          category.is_active !== false 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {category.is_active !== false ? <CheckCircle size={14} weight="bold" /> : <XCircle size={14} weight="bold" />}
                          {category.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right rounded-r-2xl bg-white group-hover:bg-transparent">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === category.id ? null : category.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all active:scale-90"
                          >
                            <DotsThreeVertical size={20} weight="bold" />
                          </button>
                          
                          {activeDropdown === category.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none z-20 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="py-2">
                                  <DropdownItem icon={<PencilSimple size={18} />} label="Edit Category" onClick={() => openEditModal(category)} />
                                  <div className="h-px bg-gray-50 my-1"></div>
                                  <DropdownItem icon={<Trash size={18} />} label="Delete" color="text-red-600 hover:bg-red-50" onClick={() => openDeleteModal(category)} />
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
          <div className="p-8 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between bg-white rounded-b-[2rem] gap-4">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * pageSize, sortedAndFilteredCategories.length)}</span> of <span className="text-gray-900">{sortedAndFilteredCategories.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-100 rounded-lg text-[11px] font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95"
              >
                Prev
              </button>
              <div className="flex items-center gap-1.5">
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
              </div>
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-100 rounded-lg text-[11px] font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? 'Edit Category' : 'New Category'}
        footer={(
          <>
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="px-8 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-900 transition-all"
            >
              Cancel
            </button>
            <button 
              form="category-form"
              type="submit" 
              disabled={isSubmitting}
              className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 text-sm shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Category'}
            </button>
          </>
        )}
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <FormGroup 
            label="Category Name" 
            placeholder="e.g. Electronics" 
            value={formData.name} 
            onChange={(val) => {
              const newSlug = val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
              setFormData({...formData, name: val, slug: formData.id ? formData.slug : newSlug});
            }} 
          />
          <FormGroup 
            label="URL Slug" 
            placeholder="e.g. electronics" 
            value={formData.slug} 
            onChange={(val) => setFormData({...formData, slug: val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')})} 
          />
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-900">Active Status</p>
              <p className="text-[11px] font-medium text-gray-400">Toggle whether this category is visible in frontend</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, is_active: !formData.is_active})}
              className={`w-12 h-6 rounded-full transition-all relative ${formData.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation Modal */}
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
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm shadow-red-100 disabled:opacity-50 text-sm"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Category'}
            </button>
          </>
        )}
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash size={32} weight="fill" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h3>
          <p className="text-gray-500 text-sm">Deleting category <span className="font-bold text-gray-900">{selectedCategory?.name}</span> will affect products associated with it. This action cannot be undone.</p>
        </div>
      </AdminModal>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 font-bold text-sm ${
          toast.type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-red-600 border-red-100'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            toast.type === 'success' ? 'bg-emerald-50' : 'bg-red-50'
          }`}>
            {toast.type === 'success' ? <Shield size={18} weight="fill" /> : <Warning size={18} weight="fill" />}
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
      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300"
      required
    />
  </div>
);

const DropdownItem = ({ icon, label, onClick, color = "text-gray-700 hover:bg-gray-50" }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all ${color}`}
  >
    <span className="opacity-70">{icon}</span>
    {label}
  </button>
);

export default AdminCategories;
