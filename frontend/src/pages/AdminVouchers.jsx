import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Plus, Trash, Pencil, X, ChartBar, Ticket, Star } from 'phosphor-react';
import api, { getFullUrl } from '../utils/api';
import Button from '../components/Button';
import AdminModal from '../components/AdminModal';

const TABS = ['Vouchers', 'Promo Rules', 'Special Prices'];

const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-medium text-sm text-gray-800";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5 ml-0.5";

const AdminVouchers = () => {
  const [activeTab, setActiveTab] = useState('Vouchers');
  const [vouchers, setVouchers] = useState([]);
  const [promoRules, setPromoRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showSpecialPriceModal, setShowSpecialPriceModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);

  const defaultVoucher = { code: '', discount_type: 'percentage', discount_value: '', min_purchase: '', max_discount: '', max_total_usage: '', max_usage_per_user: '', target_type: 'global', target_value: '', start_date: '', end_date: '' };
  const defaultPromo = { name: '', target_type: 'global', target_value: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', stackable_with: false };
  const defaultSpecialPrice = { special_price: '', special_price_start: '', special_price_end: '', special_price_target: 'global', special_price_target_value: '' };

  const [voucherForm, setVoucherForm] = useState(defaultVoucher);
  const [promoForm, setPromoForm] = useState(defaultPromo);
  const [specialPriceForm, setSpecialPriceForm] = useState(defaultSpecialPrice);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [vRes, pRes, prodRes] = await Promise.all([
        api.get('/admin/vouchers'),
        api.get('/admin/promorules'),
        api.get('/catalog/products'),
      ]);
      setVouchers(vRes.data.data || []);
      setPromoRules(pRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch promo data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Voucher handlers ──
  const openVoucherModal = (item = null) => {
    setCurrentItem(item);
    setVoucherForm(item ? {
      code: item.code,
      discount_type: item.discount_type,
      discount_value: item.discount_value,
      min_purchase: item.min_purchase || '',
      max_discount: item.max_discount || '',
      max_total_usage: item.max_total_usage || '',
      max_usage_per_user: item.max_usage_per_user || '',
      target_type: item.target_type || 'global',
      target_value: item.target_value || '',
      start_date: item.start_date?.substring(0, 10),
      end_date: item.end_date?.substring(0, 10),
    } : defaultVoucher);
    setShowVoucherModal(true);
  };

  const saveVoucher = async (e) => {
    e.preventDefault();
    const payload = {
      ...voucherForm,
      discount_value: parseInt(voucherForm.discount_value),
      min_purchase: parseInt(voucherForm.min_purchase) || 0,
      max_discount: parseInt(voucherForm.max_discount) || 0,
      max_total_usage: parseInt(voucherForm.max_total_usage) || 0,
      max_usage_per_user: parseInt(voucherForm.max_usage_per_user) || 0,
      target_type: voucherForm.target_type || 'global',
      start_date: new Date(voucherForm.start_date).toISOString(),
      end_date: new Date(voucherForm.end_date).toISOString(),
    };
    try {
      if (currentItem) await api.put(`/admin/vouchers/${currentItem.id}`, payload);
      else await api.post('/admin/vouchers', payload);
      setShowVoucherModal(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save voucher');
    }
  };

  const deleteVoucher = async (id) => {
    if (!window.confirm('Delete this voucher?')) return;
    await api.delete(`/admin/vouchers/${id}`);
    fetchAll();
  };

  // ── Promo Rule handlers ──
  const openPromoModal = (item = null) => {
    setCurrentItem(item);
    setPromoForm(item ? {
      name: item.name,
      target_type: item.target_type,
      target_value: item.target_value || '',
      discount_type: item.discount_type,
      discount_value: item.discount_value,
      start_date: item.start_date?.substring(0, 10),
      end_date: item.end_date?.substring(0, 10),
      stackable_with: item.stackable_with,
    } : defaultPromo);
    setShowPromoModal(true);
  };

  const savePromo = async (e) => {
    e.preventDefault();
    const payload = {
      ...promoForm,
      discount_value: parseInt(promoForm.discount_value),
      start_date: new Date(promoForm.start_date).toISOString(),
      end_date: new Date(promoForm.end_date).toISOString(),
    };
    try {
      if (currentItem) await api.put(`/admin/promorules/${currentItem.id}`, payload);
      else await api.post('/admin/promorules', payload);
      setShowPromoModal(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save promo rule');
    }
  };

  const deletePromo = async (id) => {
    if (!window.confirm('Delete this promo rule?')) return;
    await api.delete(`/admin/promorules/${id}`);
    fetchAll();
  };

  // ── Special Price handlers ──
  const openSpecialPriceModal = (product) => {
    setCurrentProduct(product);
    setSpecialPriceForm({
      special_price: product.special_price || '',
      special_price_start: product.special_price_start?.substring(0, 10) || '',
      special_price_end: product.special_price_end?.substring(0, 10) || '',
      special_price_target: product.special_price_target || 'global',
      special_price_target_value: product.special_price_target_value || '',
    });
    setShowSpecialPriceModal(true);
  };

  const saveSpecialPrice = async (e) => {
    e.preventDefault();
    const payload = {
      category_id: currentProduct.category_id,
      name: currentProduct.name,
      sku: currentProduct.sku,
      description: currentProduct.description,
      base_price: currentProduct.base_price,
      stock: currentProduct.stock,
      specifications: currentProduct.specifications || {},
      image_urls: currentProduct.image_urls || [],
      special_price: specialPriceForm.special_price ? parseInt(specialPriceForm.special_price) : null,
      special_price_start: specialPriceForm.special_price_start ? new Date(specialPriceForm.special_price_start).toISOString() : null,
      special_price_end: specialPriceForm.special_price_end ? new Date(specialPriceForm.special_price_end).toISOString() : null,
      special_price_target: specialPriceForm.special_price_target || 'global',
      special_price_target_value: specialPriceForm.special_price_target_value || '',
    };
    try {
      await api.put(`/admin/products/${currentProduct.id}`, payload);
      setShowSpecialPriceModal(false);
      fetchAll();
      alert('Special price saved!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const clearSpecialPrice = async (product) => {
    if (!window.confirm('Remove special price for this product?')) return;
    const payload = {
      category_id: product.category_id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      base_price: product.base_price,
      stock: product.stock,
      specifications: product.specifications || {},
      image_urls: product.image_urls || [],
      special_price: null,
      special_price_start: null,
      special_price_end: null,
    };
    await api.put(`/admin/products/${product.id}`, payload);
    fetchAll();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const formatRp = (v) => v != null ? `Rp ${Number(v).toLocaleString('id-ID')}` : '-';

  const isActive = (start, end) => {
    const now = new Date();
    return new Date(start) <= now && now <= new Date(end);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Voucher & Discount</h1>
          <p className="text-gray-500 mt-1">Manage vouchers, promo rules and special prices</p>
        </div>
        {activeTab === 'Vouchers' && (
          <Button variant="primary" onClick={() => openVoucherModal()}>
            <Plus size={20} className="mr-2" weight="bold" /> New Voucher
          </Button>
        )}
        {activeTab === 'Promo Rules' && (
          <Button variant="primary" onClick={() => openPromoModal()}>
            <Plus size={20} className="mr-2" weight="bold" /> New Promo Rule
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'Vouchers' && <Ticket size={16} className="inline mr-1.5 mb-0.5" />}
            {tab === 'Promo Rules' && <ChartBar size={16} className="inline mr-1.5 mb-0.5" />}
            {tab === 'Special Prices' && <Star size={16} className="inline mr-1.5 mb-0.5" />}
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Vouchers Tab ── */}
          {activeTab === 'Vouchers' && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-8 py-5">Code</th>
                      <th className="px-8 py-5">Discount</th>
                      <th className="px-8 py-5">Min Purchase</th>
                      <th className="px-8 py-5">Usage</th>
                      <th className="px-8 py-5">Period</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vouchers.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400">No vouchers yet</td></tr>
                    )}
                    {vouchers.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-mono font-extrabold text-gray-900 bg-gray-100 px-3 py-1 rounded-xl text-sm">{v.code}</span>
                        </td>
                        <td className="px-8 py-5 font-bold text-blue-600">
                          {v.discount_type === 'percentage' ? `${v.discount_value}%` : formatRp(v.discount_value)}
                          {v.max_discount > 0 && <span className="text-gray-400 text-xs font-normal ml-1">max {formatRp(v.max_discount)}</span>}
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-600">{formatRp(v.min_purchase) || 'None'}</td>
                        <td className="px-8 py-5 text-sm text-gray-600">{v.current_usage} / {v.max_total_usage || '∞'}</td>
                        <td className="px-8 py-5 text-xs text-gray-500">{formatDate(v.start_date)} – {formatDate(v.end_date)}</td>
                        <td className="px-8 py-5">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isActive(v.start_date, v.end_date) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {isActive(v.start_date, v.end_date) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openVoucherModal(v)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Pencil size={16} /></button>
                            <button onClick={() => deleteVoucher(v.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Promo Rules Tab ── */}
          {activeTab === 'Promo Rules' && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-8 py-5">Name</th>
                      <th className="px-8 py-5">Target</th>
                      <th className="px-8 py-5">Discount</th>
                      <th className="px-8 py-5">Stackable</th>
                      <th className="px-8 py-5">Period</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {promoRules.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400">No promo rules yet</td></tr>
                    )}
                    {promoRules.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5 font-bold text-gray-900">{r.name}</td>
                        <td className="px-8 py-5 text-sm">
                          <span className="font-bold text-gray-500 capitalize">{r.target_type}</span>
                          {r.target_value && <span className="text-gray-400 ml-1">({r.target_value})</span>}
                        </td>
                        <td className="px-8 py-5 font-bold text-blue-600">
                          {r.discount_type === 'percentage' ? `${r.discount_value}%` : formatRp(r.discount_value)}
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.stackable_with ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                            {r.stackable_with ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-xs text-gray-500">{formatDate(r.start_date)} – {formatDate(r.end_date)}</td>
                        <td className="px-8 py-5">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isActive(r.start_date, r.end_date) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {isActive(r.start_date, r.end_date) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openPromoModal(r)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Pencil size={16} /></button>
                            <button onClick={() => deletePromo(r.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Special Prices Tab ── */}
          {activeTab === 'Special Prices' && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-8 py-5">Product</th>
                      <th className="px-8 py-5">Base Price</th>
                      <th className="px-8 py-5">Special Price</th>
                      <th className="px-8 py-5">Period</th>
                      <th className="px-8 py-5">Discount</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => {
                      const discountPct = p.special_price ? Math.round((1 - p.special_price / p.base_price) * 100) : null;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0">
                                {p.image_urls?.[0] ? <img src={getFullUrl(p.image_urls[0])} alt="" className="w-full h-full object-cover" /> : null}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                                <p className="text-[10px] text-blue-600 font-bold uppercase">{p.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 font-bold text-gray-700">{formatRp(p.base_price)}</td>
                          <td className="px-8 py-5">
                            {p.special_price ? (
                              <span className="font-bold text-green-600">{formatRp(p.special_price)}</span>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-xs text-gray-500">
                            {p.special_price ? `${formatDate(p.special_price_start)} – ${formatDate(p.special_price_end)}` : '—'}
                          </td>
                          <td className="px-8 py-5">
                            {discountPct != null && (
                              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-red-50 text-red-600">-{discountPct}%</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openSpecialPriceModal(p)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Pencil size={16} /></button>
                              {p.special_price && (
                                <button onClick={() => clearSpecialPrice(p)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><X size={16} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>

    {/* Modals outside animated div */}

      {/* ── Voucher Modal ── */}
      <AdminModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        title={currentItem ? 'Edit Voucher' : 'New Voucher'}
        variant="centered"
        size="md"
        footer={(
          <>
            <button 
              type="button" 
              onClick={() => setShowVoucherModal(false)}
              className="px-10 py-2.5 text-sm font-bold text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-all"
            >
              Cancel
            </button>
            <button 
              className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 text-sm" 
              type="submit" 
              form="voucher-form"
            >
              {currentItem ? 'Save Changes' : 'Create Voucher'}
            </button>
          </>
        )}
      >
        <form id="voucher-form" onSubmit={saveVoucher} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>Voucher Code</label>
              <input required value={voucherForm.code} onChange={e => setVoucherForm({...voucherForm, code: e.target.value})} placeholder="e.g. HEMAT10" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Discount Type</label>
              <select value={voucherForm.discount_type} onChange={e => setVoucherForm({...voucherForm, discount_type: e.target.value})} className={inputClass}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (Rp)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>Discount Value</label>
              <input type="number" required min="1" value={voucherForm.discount_value} onChange={e => setVoucherForm({...voucherForm, discount_value: e.target.value})} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Max Discount (Rp, optional)</label>
              <input type="number" min="0" value={voucherForm.max_discount} onChange={e => setVoucherForm({...voucherForm, max_discount: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>Max Total Usage</label>
              <input type="number" min="0" placeholder="0 = unlimited" value={voucherForm.max_total_usage} onChange={e => setVoucherForm({...voucherForm, max_total_usage: e.target.value})} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Max Usage per User</label>
              <input type="number" min="0" placeholder="0 = unlimited" value={voucherForm.max_usage_per_user} onChange={e => setVoucherForm({...voucherForm, max_usage_per_user: e.target.value})} className={inputClass} />
            </div>
          </div>
          {/* Targeting */}
          <div className="pt-4 border-t border-gray-50">
            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-6">User Targeting & Scope</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className={labelClass}>Target Condition</label>
                <select value={voucherForm.target_type} onChange={e => setVoucherForm({...voucherForm, target_type: e.target.value, target_value: ''})} className={inputClass}>
                  <option value="global">🌐 Global (All Users)</option>
                  <option value="email">✉️ Specific Email</option>
                  <option value="domain">🏢 Email Domain</option>
                </select>
              </div>
              {voucherForm.target_type !== 'global' && (
                <div className="space-y-1.5">
                  <label className={labelClass}>
                    {voucherForm.target_type === 'email' ? 'Email Address' : 'Domain (e.g. @company.com)'}
                  </label>
                  <input
                    required
                    value={voucherForm.target_value}
                    onChange={e => setVoucherForm({...voucherForm, target_value: e.target.value})}
                    placeholder={voucherForm.target_type === 'email' ? 'user@mail.com' : '@company.com'}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>Start Date</label>
              <input type="date" required value={voucherForm.start_date} onChange={e => setVoucherForm({...voucherForm, start_date: e.target.value})} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>End Date</label>
              <input type="date" required value={voucherForm.end_date} onChange={e => setVoucherForm({...voucherForm, end_date: e.target.value})} className={inputClass} />
            </div>
          </div>
        </form>
      </AdminModal>

      {/* ── Promo Rule Modal ── */}
      <AdminModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        title={currentItem ? 'Edit Promo Rule' : 'New Promo Rule'}
        variant="centered"
        size="md"
        footer={(
          <>
            <button 
              type="button" 
              onClick={() => setShowPromoModal(false)}
              className="px-10 py-2.5 text-sm font-bold text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-all"
            >
              Cancel
            </button>
            <button 
              className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 text-sm" 
              type="submit" 
              form="promo-form"
            >
              {currentItem ? 'Save Changes' : 'Create Rule'}
            </button>
          </>
        )}
      >
        <form id="promo-form" onSubmit={savePromo} className="space-y-6">
          <div className="space-y-1.5">
            <label className={labelClass}>Rule Name</label>
            <input required value={promoForm.name} onChange={e => setPromoForm({...promoForm, name: e.target.value})} placeholder="e.g. Early Bird Discount" className={inputClass} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>Target Type</label>
              <select value={promoForm.target_type} onChange={e => setPromoForm({...promoForm, target_type: e.target.value, target_value: ''})} className={inputClass}>
                <option value="global">🌐 Global (All Users)</option>
                <option value="domain">🏢 Email Domain</option>
                <option value="role">👤 User Role</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Target Value (optional)</label>
              <input value={promoForm.target_value} onChange={e => setPromoForm({...promoForm, target_value: e.target.value})} placeholder="e.g. gmail.com atau admin" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>Discount Type</label>
              <select value={promoForm.discount_type} onChange={e => setPromoForm({...promoForm, discount_type: e.target.value})} className={inputClass}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (Rp)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Discount Value</label>
              <input type="number" required min="1" value={promoForm.discount_value} onChange={e => setPromoForm({...promoForm, discount_value: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>Start Date</label>
              <input type="date" required value={promoForm.start_date} onChange={e => setPromoForm({...promoForm, start_date: e.target.value})} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>End Date</label>
              <input type="date" required value={promoForm.end_date} onChange={e => setPromoForm({...promoForm, end_date: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:bg-white hover:border-indigo-200 transition-all">
              <input type="checkbox" checked={promoForm.stackable_with} onChange={e => setPromoForm({...promoForm, stackable_with: e.target.checked})} className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
              <div className="flex-1">
                <span className="block text-sm font-bold text-gray-900">Stackable with Vouchers</span>
                <span className="block text-xs text-gray-500 font-medium">If enabled, this promo can be combined with voucher codes in a single order</span>
              </div>
            </label>
          </div>
        </form>
      </AdminModal>

      {/* ── Special Price Modal ── */}
      <AdminModal
        isOpen={showSpecialPriceModal && !!currentProduct}
        onClose={() => setShowSpecialPriceModal(false)}
        title="Special Price"
        variant="drawer"
        footer={(
          <>
            <button 
              type="button" 
              onClick={() => setShowSpecialPriceModal(false)}
              className="px-10 py-2.5 text-sm font-bold text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-all"
            >
              Cancel
            </button>
            <button 
              className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 text-sm" 
              type="submit" 
              form="special-price-form"
            >
              Save Special Price
            </button>
          </>
        )}
      >
        {currentProduct && (
          <form id="special-price-form" onSubmit={saveSpecialPrice} className="space-y-6">
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100/50">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Selected Product</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{currentProduct.name}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-sm font-bold text-gray-400">Regular:</span>
                <span className="text-xl font-extrabold text-gray-400 line-through">{formatRp(currentProduct.base_price)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Special Price (Rp)</label>
              <input type="number" required min="1" value={specialPriceForm.special_price} onChange={e => setSpecialPriceForm({...specialPriceForm, special_price: e.target.value})} className={`${inputClass} text-2xl font-black text-green-600`} />
              {specialPriceForm.special_price && currentProduct.base_price && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[11px] font-black uppercase">
                  Discount: {Math.round((1 - parseInt(specialPriceForm.special_price) / currentProduct.base_price) * 100)}% Off
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className={labelClass}>Start Date</label>
                <input type="date" required value={specialPriceForm.special_price_start} onChange={e => setSpecialPriceForm({...specialPriceForm, special_price_start: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>End Date</label>
                <input type="date" required value={specialPriceForm.special_price_end} onChange={e => setSpecialPriceForm({...specialPriceForm, special_price_end: e.target.value})} className={inputClass} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-6">User Targeting</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>Target</label>
                  <select value={specialPriceForm.special_price_target} onChange={e => setSpecialPriceForm({...specialPriceForm, special_price_target: e.target.value, special_price_target_value: ''})} className={inputClass}>
                    <option value="global">🌐 Global (All Users)</option>
                    <option value="email">✉️ Specific Email</option>
                    <option value="domain">🏢 Email Domain</option>
                  </select>
                </div>
                {specialPriceForm.special_price_target !== 'global' && (
                  <div className="space-y-1.5">
                    <label className={labelClass}>
                      {specialPriceForm.special_price_target === 'email' ? 'Email Address' : 'Domain (e.g. @company.com)'}
                    </label>
                    <input
                      required
                      value={specialPriceForm.special_price_target_value}
                      onChange={e => setSpecialPriceForm({...specialPriceForm, special_price_target_value: e.target.value})}
                      placeholder={specialPriceForm.special_price_target === 'email' ? 'user@mail.com' : '@company.com'}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </AdminModal>
    </>
  );
};

export default AdminVouchers;
