import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle, Truck, X, MagnifyingGlass, ArrowsClockwise, Receipt, CaretDown, CaretUp } from 'phosphor-react';
import api from '../utils/api';
import Button from '../components/Button';
import AdminModal from '../components/AdminModal';

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', color: 'bg-gray-50 text-gray-600 border border-gray-100', dot: 'bg-gray-300' },
  paid:            { label: 'Paid',            color: 'bg-blue-50 text-blue-700 border border-blue-200',   dot: 'bg-blue-500'   },
  processing:      { label: 'Processing',      color: 'bg-gray-100 text-gray-900 border border-gray-200', dot: 'bg-gray-400' },
  shipped:         { label: 'Shipped',         color: 'bg-black text-white border-0',            dot: 'bg-white'    },
  delivered:       { label: 'Delivered',       color: 'bg-gray-50 text-gray-500 border border-gray-100', dot: 'bg-gray-300' },
  cancelled:       { label: 'Cancelled',       color: 'bg-red-50 text-red-700 border border-red-100',    dot: 'bg-red-500'   },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    setActionLoading(orderId + '_cancel');
    try {
      await api.post(`/admin/orders/${orderId}/cancel`);
      setConfirmModal(null);
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const markDelivered = async (orderId) => {
    setActionLoading(orderId + '_deliver');
    try {
      await api.post(`/admin/orders/${orderId}/deliver`);
      setConfirmModal(null);
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const generateAWB = async (orderId) => {
    setActionLoading(orderId + '_awb');
    try {
      await api.post(`/admin/orders/${orderId}/awb`);
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate AWB');
    } finally {
      setActionLoading(null);
    }
  };

  const authorizePayment = async (orderId) => {
    setActionLoading(orderId + '_payment');
    try {
      await api.post(`/admin/orders/${orderId}/payment`);
      setConfirmModal(null);
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to authorize payment');
    } finally {
      setActionLoading(null);
    }
  };

  const printLabel = async (orderId) => {
    try {
      const res = await api.get(`/admin/orders/${orderId}/label`);
      window.open(res.data.data, '_blank');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fetch shipping label');
    }
  };

  const printInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Invoice ${order.order_number}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: 800; color: #000; }
            .inv-info { text-align: right; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 12px; font-size: 12px; color: #666; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .total-section { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-weight: 800; font-size: 18px; color: #000; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">GO-COMMERCE</div>
            <div class="inv-info">
              <h1 style="margin:0">INVOICE</h1>
              <p style="margin:5px 0; font-family:monospace; font-weight:bold;">${order.order_number}</p>
              <p style="margin:0; font-size:12px; color:#666;">${new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="grid">
            <div>
              <p style="font-size:12px; color:#999; margin-bottom:5px; font-weight:bold;">Tujuan Pengiriman</p>
              <p style="margin:0; font-weight:bold;">${order.user?.name}</p>
              <p style="margin:5px 0; font-size:14px;">${order.shipping_address}</p>
              <p style="margin:0; font-size:14px;">${order.postal_code || ''}</p>
            </div>
            <div>
              <p style="font-size:12px; color:#999; margin-bottom:5px; font-weight:bold;">Metode Pengiriman</p>
              <p style="margin:0; font-weight:bold;">${order.courier_name?.toUpperCase()} - ${order.courier_service?.toUpperCase()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>PRODUK</th>
                <th style="text-align:center">JUMLAH</th>
                <th style="text-align:right">HARGA</th>
                <th style="text-align:right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => `
                <tr>
                  <td>${item.product?.name || 'Product'}</td>
                  <td style="text-align:center">${item.quantity}</td>
                  <td style="text-align:right">Rp ${item.price.toLocaleString()}</td>
                  <td style="text-align:right">Rp ${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-section">
            <div class="total-row"><span>Subtotal</span> <span>Rp ${order.total_amount.toLocaleString()}</span></div>
            ${order.discount_amount > 0 ? `<div class="total-row" style="color:red"><span>Diskon</span> <span>-Rp ${order.discount_amount.toLocaleString()}</span></div>` : ''}
            <div class="total-row"><span>Ongkos Kirim</span> <span>Rp ${order.shipping_cost.toLocaleString()}</span></div>
            <div class="total-row grand-total"><span>Total Bayar</span> <span>Rp ${order.final_amount.toLocaleString()}</span></div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const formatRp = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`;
  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filtered = orders.filter(o => {
    const matchSearch = search === '' || 
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending_payment').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
  };

  const getFullUrl = (path) => path?.startsWith('http') ? path : `http://localhost:8080${path}`;

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-sans pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-gray-500 mt-1 font-medium">Elevated management for your operations</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchOrders}
          className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest px-4 h-9"
        >
          <ArrowsClockwise size={16} className="mr-2" /> Sync Records
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', value: stats.total, icon: <Receipt size={24} weight="duotone" />, color: 'text-indigo-600 bg-indigo-50', filterKey: 'all' },
          { label: 'Awaiting Payment', value: stats.pending, icon: <Package size={24} weight="duotone" />, color: 'text-amber-600 bg-amber-50', filterKey: 'pending_payment' },
          { label: 'Ready to Ship', value: stats.paid, icon: <CheckCircle size={24} weight="duotone" />, color: 'text-emerald-600 bg-emerald-50', filterKey: 'paid' },
          { label: 'Shipped', value: stats.shipped, icon: <Truck size={24} weight="duotone" />, color: 'text-blue-600 bg-blue-50', filterKey: 'shipped' },
        ].map(s => (
          <div 
            key={s.label} 
            onClick={() => setStatusFilter(s.filterKey)}
            className={`bg-white rounded-xl border p-6 flex flex-col gap-4 group hover:shadow-md transition-all duration-300 cursor-pointer ${statusFilter === s.filterKey ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-100 shadow-sm'}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-3xl font-black text-gray-900">{s.value}</p>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, Customer Name or Email..."
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-all text-sm font-medium"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-6 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-all text-sm font-bold text-gray-700 cursor-pointer"
        >
          <option value="all">All Transactions</option>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400 animate-pulse">Synchronizing records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-32 text-center group">
          <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Package size={40} className="text-gray-300" />
          </div>
          <p className="text-xl font-black text-gray-900">Zero matches found</p>
          <p className="text-gray-400 mt-1 max-w-xs mx-auto">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
            const isExpanded = expandedOrder === order.id;
            const isPaymentLoading = actionLoading === order.id + '_payment';
            const isAWBLoading = actionLoading === order.id + '_awb';
            const isCancelLoading = actionLoading === order.id + '_cancel';
            const isDeliverLoading = actionLoading === order.id + '_deliver';

            return (
              <div key={order.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${isExpanded ? 'ring-1 ring-black' : ''}`}>
                <div
                  className="flex items-center gap-6 p-7 cursor-pointer hover:bg-gray-50/30 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 animate-pulse ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
                      <span className="font-mono font-black text-gray-900 text-sm tracking-tighter uppercase">{order.order_number}</span>
                      <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-lg ${cfg.color}`}>{cfg.label}</span>
                      {order.awb_number && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                          Track ID: {order.awb_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                      <span className="font-bold text-gray-800">{order.user?.name}</span>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="truncate max-w-[150px]">{order.user?.email}</span>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-[11px] font-bold text-gray-400 uppercase">{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 px-4">
                    <p className="text-xl font-black text-gray-900 tabular-nums">{formatRp(order.final_amount)}</p>
                  </div>
                  <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {order.status === 'pending_payment' && (
                      <Button 
                        variant="primary" 
                        loading={isPaymentLoading}
                        className="text-[10px] h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white uppercase font-black tracking-widest border-0" 
                        onClick={() => setConfirmModal({ type: 'payment', orderId: order.id, orderNumber: order.order_number })}
                      >
                        Authorize
                      </Button>
                    )}
                    {order.status === 'paid' && (
                      <Button 
                        variant="primary" 
                        loading={isAWBLoading}
                        className="text-[10px] h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white uppercase font-black tracking-widest border-0" 
                        onClick={() => generateAWB(order.id)}
                      >
                        Generate AWB
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button 
                        variant="primary" 
                        loading={isDeliverLoading}
                        className="text-[10px] h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white uppercase font-black tracking-widest border-0" 
                        onClick={() => setConfirmModal({ type: 'deliver', orderId: order.id, orderNumber: order.order_number })}
                      >
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-gray-100 text-black' : 'text-gray-300'}`}>
                    {isExpanded ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-50 bg-gray-50/30 px-8 py-8 space-y-8 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Selected Order Details</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="lg:col-span-2 space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-1">Package Contents</p>
                          <div className="space-y-2.5">
                            {(order.items || []).map(item => (
                              <div key={item.id} className="flex justify-between items-center bg-white rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                                     {item.product?.image_urls?.[0] ? <img src={getFullUrl(item.product.image_urls[0])} className="w-full h-full object-cover" /> : <Package size={24} />}
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-gray-900 group-hover:text-black">{item.product?.name || `SKU: ${item.product?.sku || 'N/A'}`}</p>
                                    <p className="text-xs text-gray-400 mt-1">{item.quantity} Unit · {formatRp(item.price)} · Stock: {item.product?.stock ?? 0}</p>
                                  </div>
                                </div>
                                <p className="font-black text-gray-900 tabular-nums">{formatRp(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Fulfillment Data</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Detail label="Carrier" value={`${order.courier_name} (${order.courier_service})`} icon={<Truck size={16} />} />
                            <Detail label="Recipient" value={order.user?.name} icon={<Receipt size={16} />} />
                            <Detail label="Destination" value={order.shipping_address} icon={<Truck size={16} />} isLong />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 relative overflow-hidden group">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 font-sans">Payment Overview</p>
                          <div className="space-y-4">
                            <FinanceRow label="Order Subtotal" value={formatRp(order.total_amount)} />
                            <FinanceRow label="Shipping fee" value={formatRp(order.shipping_cost)} />
                            <div className="border-t border-gray-100 pt-5 mt-2 flex justify-between items-center">
                              <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Invoice</span>
                              <span className="text-2xl font-black text-gray-900 tracking-tighter">{formatRp(order.final_amount)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-6">
                               <button onClick={() => printInvoice(order)} className="flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-lg text-gray-500 font-bold text-[10px] uppercase hover:border-black hover:text-black transition-all"><Receipt size={14} /> Invoice</button>
                               {order.awb_number ? (
                                 <button onClick={() => printLabel(order.id)} className="flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-lg text-gray-500 font-bold text-[10px] uppercase hover:border-black hover:text-black transition-all"><Truck size={14} /> Label</button>
                               ) : <div className="h-10 border border-gray-100 border-dashed rounded-lg opacity-30 flex items-center justify-center"><Truck size={14} /></div>}
                            </div>
                            {(order.status === 'pending_payment' || order.status === 'paid') && (
                              <button onClick={() => setConfirmModal({ type: 'cancel', orderId: order.id, orderNumber: order.order_number })} className="w-full mt-2 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-red-600 transition-colors">Void Order</button>
                            )}
                          </div>
                        </div>
                        {order.status === 'pending_payment' && order.payment_url && (
                          <a href={order.payment_url} target="_blank" rel="noreferrer"
                            className="block bg-blue-600 p-3.5 rounded-lg text-center group hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-600/20"
                          >
                            <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-0.5">Gateway / Xendit</p>
                            <p className="text-sm text-white font-extrabold flex items-center justify-center gap-2 uppercase tracking-wide">
                              Pay Invoice
                              <ArrowsClockwise size={14} className="group-hover:rotate-180 transition-all duration-700" />
                            </p>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>

      <AdminModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.type === 'cancel' ? 'Void Transaction' : 'Confirm Action'}
        variant="centered"
        size="sm"
        footer={(
          <div className="flex gap-4 w-full px-8 pb-8">
            <button onClick={() => setConfirmModal(null)} className="flex-1 h-12 text-sm font-black uppercase text-gray-400 hover:text-gray-900">Back</button>
            <button onClick={() => {
                if(confirmModal.type === 'cancel') cancelOrder(confirmModal.orderId);
                else if(confirmModal.type === 'payment') authorizePayment(confirmModal.orderId);
                else markDelivered(confirmModal.orderId);
              }} className={`flex-[2] h-12 rounded-xl font-black uppercase text-white shadow-lg ${confirmModal?.type === 'cancel' ? 'bg-red-600 shadow-red-600/20' : 'bg-blue-600 shadow-blue-600/20'}`}>Confirm</button>
          </div>
        )}
      >
        {confirmModal && (
          <div className="text-center space-y-6 pt-4 px-8 pb-4">
            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center ${confirmModal.type === 'cancel' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-900'}`}>
              {confirmModal.type === 'cancel' ? <X size={40} weight="duotone" /> : <CheckCircle size={40} weight="duotone" />}
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-gray-900">{confirmModal.orderNumber}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{confirmModal.type === 'cancel' ? 'Warning: This will void the transaction and reinstate inventory stock.' : 'Confirming the selected administrative action.'}</p>
            </div>
          </div>
        )}
      </AdminModal>
    </>
  );
};

const FinanceRow = ({ label, value, color = 'text-gray-900' }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    <span className={`font-extrabold tabular-nums ${color}`}>{value}</span>
  </div>
);

const Detail = ({ label, value, icon, isLong = false }) => (
  <div className={`flex items-start gap-4 ${isLong ? 'md:col-span-2' : ''}`}>
    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-extrabold text-gray-800 leading-tight">{value}</p>
    </div>
  </div>
);

export default AdminOrders;
