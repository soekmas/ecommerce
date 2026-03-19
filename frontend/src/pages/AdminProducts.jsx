import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Trash, Pencil, Upload, X, ShieldCheck, 
  Tag, Cube, ImageSquare, ListChecks, MagnifyingGlass,
  Funnel, CaretDown, CaretUp, ArrowsDownUp, CheckCircle,
  XCircle, DotsThreeVertical
} from 'phosphor-react';
import api, { getFullUrl } from '../utils/api';
import Button from '../components/Button';
import AdminModal from '../components/AdminModal';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', order: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeActionId, setActiveActionId] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu')) {
        setActiveActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    slug: '',
    description: '',
    category_id: '',
    base_price: '',
    stock: '',
    specifications: {},
    image_urls: [],
    is_active: true
  });
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/catalog/products'),
        api.get('/catalog/categories')
      ]);
      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleOpenModal = (product = null) => {
    setError('');
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku || '',
        slug: product.slug || '',
        description: product.description || '',
        category_id: product.category_id,
        base_price: product.base_price,
        stock: product.stock,
        specifications: product.specifications || {},
        image_urls: product.image_urls || [],
        is_active: product.is_active ?? true
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        name: '',
        sku: '',
        slug: '',
        description: '',
        category_id: '',
        base_price: '',
        stock: '',
        specifications: {},
        image_urls: [],
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type));

    if (validFiles.length === 0) return;

    const uploadFormData = new FormData();
    validFiles.forEach(file => uploadFormData.append('images', file));

    try {
      const res = await api.post('/admin/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...res.data.data]
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    }
  };

  const removeImage = (url) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter(u => u !== url)
    }));
  };

  const addSpec = () => {
    if (!specKey || !specVal) return;
    setFormData(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [specKey]: specVal }
    }));
    setSpecKey('');
    setSpecVal('');
  };

  const removeSpec = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData(prev => ({ ...prev, specifications: newSpecs }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      ...formData,
      base_price: parseInt(formData.base_price),
      stock: parseInt(formData.stock),
      category_id: parseInt(formData.category_id)
    };

    try {
      if (currentProduct) {
        await api.put(`/admin/products/${currentProduct.id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  // Filter & Logic
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === 'category') {
      aVal = a.category?.name || '';
      bVal = b.category?.name || '';
    }

    if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const currentData = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Product Catalog</h1>
            <p className="text-gray-500 mt-1">Manage your store items, inventory and specifications</p>
          </div>
          <button 
            onClick={() => handleOpenModal()} 
            className="group flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 active:scale-95 text-sm font-bold"
          >
            <Plus size={18} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
            New Product
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search products by name, SKU, or category..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Catalogue...</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                  <tr>
                    <th className="px-8 py-6 cursor-pointer hover:text-black transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        Product {sortConfig.key === 'name' ? (sortConfig.order === 'asc' ? <CaretUp /> : <CaretDown />) : <ArrowsDownUp />}
                      </div>
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:text-black transition-colors" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-2">
                        Category {sortConfig.key === 'category' ? (sortConfig.order === 'asc' ? <CaretUp /> : <CaretDown />) : <ArrowsDownUp />}
                      </div>
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:text-black transition-colors" onClick={() => handleSort('base_price')}>
                      <div className="flex items-center gap-2">
                        Pricing {sortConfig.key === 'base_price' ? (sortConfig.order === 'asc' ? <CaretUp /> : <CaretDown />) : <ArrowsDownUp />}
                      </div>
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:text-black transition-colors" onClick={() => handleSort('stock')}>
                      <div className="flex items-center gap-2">
                        Inventory {sortConfig.key === 'stock' ? (sortConfig.order === 'asc' ? <CaretUp /> : <CaretDown />) : <ArrowsDownUp />}
                      </div>
                    </th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center">
                          <Package size={64} className="text-gray-100 mb-6" weight="thin" />
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No matching products found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentData.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 overflow-hidden shrink-0 shadow-sm group-hover:bg-white transition-all">
                              {product.image_urls?.[0] ? (
                                <img src={getFullUrl(product.image_urls[0])} alt="" className="w-full h-full object-cover" />
                              ) : <Package size={24} weight="thin" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-gray-900 truncate text-sm">{product.name}</p>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate mt-0.5">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-gray-500">
                          {product.category?.name || 'Uncategorized'}
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-gray-900 leading-none">Rp {product.base_price?.toLocaleString()}</p>
                          {product.special_price && <p className="text-[10px] text-gray-400 line-through mt-1">Rp {product.special_price.toLocaleString()}</p>}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></div>
                            <p className="text-sm font-bold text-gray-600">{product.stock} units</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${product.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {product.is_active ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} weight="fill" />}
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right relative overflow-visible">
                          <div className="flex justify-end action-menu">
                            <button 
                              onClick={() => setActiveActionId(activeActionId === product.id ? null : product.id)}
                              className={`p-1.5 rounded-lg transition-all active:scale-90 ${activeActionId === product.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                            >
                              <DotsThreeVertical size={20} weight="bold" />
                            </button>

                            {activeActionId === product.id && (
                              <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-6 w-48 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-50 py-2 z-[60] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                <button 
                                  onClick={() => { handleOpenModal(product); setActiveActionId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                    <Pencil size={14} weight="bold" />
                                  </div>
                                  Edit Product
                                </button>
                                <button 
                                  onClick={() => { deleteProduct(product.id); setActiveActionId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center">
                                    <Trash size={14} weight="bold" />
                                  </div>
                                  Delete Item
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, sortedProducts.length)}</span> of <span className="text-gray-900">{sortedProducts.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2.5 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  >
                    <CaretDown size={14} className="rotate-90" weight="bold" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-black text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2.5 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  >
                    <CaretDown size={14} className="-rotate-90" weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={currentProduct ? 'Edit Product Details' : 'Create New Product Entry'}
        size="2xl"
        footer={(
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.is_active ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${formData.is_active ? 'left-7' : 'left-1'}`}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Online Status</span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${formData.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                form="product-form"
                type="submit"
                disabled={submitting}
                className="px-10 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 active:scale-95"
              >
                {submitting ? 'Saving...' : currentProduct ? 'Save Changes' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        )}
      >
        <form id="product-form" onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold animate-shake">
              <XCircle size={20} weight="fill" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-10">
            {/* General Info Grid */}
            <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100/50">
                <Cube size={20} className="text-blue-600" weight="bold" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">General Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                  <input 
                    type="text" required placeholder="Enter product title..."
                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-bold" 
                    value={formData.name} onChange={handleNameChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU Identity</label>
                  <input 
                    type="text" required placeholder="e.g. PRD-12345"
                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-black text-blue-600" 
                    value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-bold appearance-none cursor-pointer"
                      value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    >
                      <option value="">Select a Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <CaretDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Slug</label>
                  <input 
                    type="text" required placeholder="slug-for-product"
                    className="w-full px-5 py-3.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium text-blue-600"
                    value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Description</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe the product features and details..."
                    className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-medium h-32 resize-none"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100/50">
                <Tag size={20} className="text-green-600" weight="bold" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Inventory & Pricing</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Normal Price (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xs">Rp</span>
                    <input 
                      type="number" required min="0"
                      className="w-full pl-12 pr-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-black" 
                      value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Stock Level</label>
                  <div className="relative">
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-gray-300 text-[10px] uppercase">Units</span>
                    <input 
                      type="number" required min="0"
                      className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-black" 
                      value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Specifications Section */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <ListChecks size={20} className="text-purple-600" weight="bold" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Detailed Specifications</h3>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Key" 
                    className="w-24 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-white transition-all"
                    value={specKey} onChange={(e) => setSpecKey(e.target.value)}
                  />
                  <input 
                    type="text" placeholder="Value" 
                    className="w-24 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold focus:bg-white transition-all"
                    value={specVal} onChange={(e) => setSpecVal(e.target.value)}
                  />
                  <button type="button" onClick={addSpec} className="p-2 bg-purple-600 text-white rounded-xl hover:bg-black transition-all">
                    <Plus size={16} weight="bold" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(formData.specifications).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group border border-transparent hover:bg-white hover:border-gray-100 transition-all">
                    <div className="min-w-0 pr-2">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">{k}</span>
                      <span className="block text-xs font-bold text-gray-900 truncate">{v}</span>
                    </div>
                    <button type="button" onClick={() => removeSpec(k)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                ))}
                {Object.keys(formData.specifications).length === 0 && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No technical specifications defined</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Media Section - Bottom */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <ImageSquare size={20} className="text-orange-600" weight="bold" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Product Media Assets</h3>
                </div>
                <label className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-orange-600 hover:text-white transition-all flex items-center gap-2">
                  <Upload size={14} weight="bold" />
                  Upload Images
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} accept=".png,.jpg,.jpeg" />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.image_urls.map((url, idx) => (
                  <div key={idx} className={`aspect-square rounded-2xl border-2 overflow-hidden relative group transition-all ${idx === 0 ? 'border-blue-200' : 'border-gray-50 hover:border-gray-200'}`}>
                    <img src={getFullUrl(url)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <button 
                        type="button" 
                        onClick={() => removeImage(url)}
                        className="w-10 h-10 bg-white/20 text-white rounded-xl hover:bg-red-500 transition-colors flex items-center justify-center"
                      >
                        <Trash size={18} weight="bold" />
                      </button>
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-[8px] font-black text-white uppercase rounded-lg shadow-sm">Cover</div>
                    )}
                  </div>
                ))}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 hover:border-gray-300 hover:bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer transition-all group shrink-0 relative overflow-hidden">
                  <Plus size={32} weight="thin" className="text-gray-300 group-hover:text-gray-400 group-hover:scale-110 transition-all duration-300" />
                  <span className="mt-2 text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] group-hover:text-gray-400 transition-colors">Add Media</span>
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} accept=".png,.jpg,.jpeg" />
                </label>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30 flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <ShieldCheck size={18} className="text-blue-600" weight="bold" />
                </div>
                <p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest">
                  High quality images increase conversion by up to 40%. The first image uploaded will serve as the primary product card cover.
                </p>
              </div>
            </div>
          </div>
        </form>
      </AdminModal>
    </>
  );
};

export default AdminProducts;
