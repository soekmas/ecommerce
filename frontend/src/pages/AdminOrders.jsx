import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle, Truck, X, MagnifyingGlass, ArrowsClockwise, Receipt, CaretDown, CaretUp } from 'phosphor-react';
import api from '../utils/api';
import Button from '../components/Button';
import AdminModal from '../components/AdminModal';

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-400' },
  paid:            { label: 'Paid',            color: 'bg-blue-50 text-blue-700 border border-blue-200',   dot: 'bg-blue-500'   },
  processing:      { label: 'Processing',      color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
  shipped:         { label: 'Shipped',         color: 'bg-indigo-50 text-indigo-700 border border-indigo-200', dot: 'bg-indigo-500' },
  delivered:       { label: 'Delivered',       color: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500' },
  cancelled:       { label: 'Cancelled',       color: 'bg-red-50 text-red-700 border border-red-200',     dot: 'bg-red-500'    },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'payment'|'awb', orderId, orderNumber }

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

  const confirmPayment = async (orderId) => {
    setActionLoading(orderId + '_payment');
    try {
      await api.post(`/admin/orders/${orderId}/payment`);
      setConfirmModal(null);
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setActionLoading(null);
    }
  };

  const generateAWB = async (orderId) => {
    setActionLoading(orderId + '_awb');
    try {
      await api.post(`/admin/orders/${orderId}/awb`);
      setConfirmModal(null);
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate AWB');
    } finally {
      setActionLoading(null);
    }
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

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-gray-500 mt-1">Review, confirm payments, and manage shipments</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>
          <ArrowsClockwise size={18} className="mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: <Receipt size={22} />, color: 'text-gray-600 bg-gray-100' },
          { label: 'Awaiting Payment', value: stats.pending, icon: <Package size={22} />, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Ready to Ship', value: stats.paid, icon: <CheckCircle size={22} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Shipped', value: stats.shipped, icon: <Truck size={22} />, color: 'text-indigo-600 bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-[1.5rem] border border-gray-100 p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number, name or email..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-5 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-bold text-gray-700"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
            const isExpanded = expandedOrder === order.id;
            const isPaymentLoading = actionLoading === order.id + '_payment';
            const isAWBLoading = actionLoading === order.id + '_awb';

            return (
              <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all">
                {/* Order Row */}
                <div
                  className="flex items-center gap-4 p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <span className="font-mono font-extrabold text-gray-900 text-sm">{order.order_number}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {order.awb_number && (
                        <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full">
                          AWB: {order.awb_number}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      <span className="font-bold text-gray-700">{order.user?.name}</span>
                      <span className="mx-1.5">·</span>{order.user?.email}
                      <span className="mx-1.5">·</span>{formatDate(order.created_at)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-gray-900">{formatRp(order.final_amount)}</p>
                    {order.discount_amount > 0 && (
                      <p className="text-xs text-green-600 font-bold">-{formatRp(order.discount_amount)} diskon</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {order.status === 'pending_payment' && (
                      <Button
                        variant="primary"
                        className="text-xs px-4 py-2 rounded-xl whitespace-nowrap"
                        onClick={() => setConfirmModal({ type: 'payment', orderId: order.id, orderNumber: order.order_number })}
                        disabled={isPaymentLoading}
                      >
                        <CheckCircle size={15} className="mr-1.5" />
                        {isPaymentLoading ? 'Processing...' : 'Confirm Payment'}
                      </Button>
                    )}
                    {order.status === 'paid' && (
                      <Button
                        variant="outline"
                        className="text-xs px-4 py-2 rounded-xl whitespace-nowrap border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        onClick={() => setConfirmModal({ type: 'awb', orderId: order.id, orderNumber: order.order_number })}
                        disabled={isAWBLoading}
                      >
                        <Truck size={15} className="mr-1.5" />
                        {isAWBLoading ? 'Generating...' : 'Generate AWB'}
                      </Button>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <div className="text-gray-400 ml-1">
                    {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                  </div>
                </div>

                {/* Expanded Order Items */}
                {isExpanded && (
                  <div className="border-t border-gray-50 bg-gray-50/50 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Items */}
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-3">Order Items</p>
                        <div className="space-y-2">
                          {(order.items || []).map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white rounded-2xl p-3 text-sm">
                              <div>
                                <p className="font-bold text-gray-900">{item.product?.name || `Product #${item.product_id}`}</p>
                                <p className="text-xs text-gray-400">{item.quantity} × {formatRp(item.price)}</p>
                              </div>
                              <p className="font-black text-gray-700">{formatRp(item.price * item.quantity)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase text-gray-400">Order Details</p>
                        <div className="bg-white rounded-2xl p-4 space-y-2 text-sm">
                          {/* Price Breakdown */}
                          <Row label="Subtotal (before discount)" value={formatRp(order.total_amount)} />

                          {/* Promo Rule Discount */}
                          {order.applied_promo_rule && (
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <span className="text-gray-400 text-xs">Promo Rule</span>
                                <p className="text-[11px] text-purple-600 font-bold">{order.applied_promo_rule.name}</p>
                                <p className="text-[10px] text-gray-400">
                                  {order.applied_promo_rule.discount_type === 'percentage'
                                    ? `${order.applied_promo_rule.discount_value}% off`
                                    : `Potongan ${formatRp(order.applied_promo_rule.discount_value)}`}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-purple-600">
                                -{order.applied_promo_rule.discount_type === 'percentage'
                                  ? `${order.applied_promo_rule.discount_value}%`
                                  : formatRp(order.applied_promo_rule.discount_value)}
                              </span>
                            </div>
                          )}

                          {/* Voucher Discount */}
                          {order.applied_voucher && (
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <span className="text-gray-400 text-xs">Voucher</span>
                                <p className="text-[11px] font-mono font-bold text-green-600">{order.applied_voucher.code}</p>
                                <p className="text-[10px] text-gray-400">
                                  {order.applied_voucher.discount_type === 'percentage'
                                    ? `${order.applied_voucher.discount_value}% off${order.applied_voucher.max_discount > 0 ? ` (maks. ${formatRp(order.applied_voucher.max_discount)})` : ''}`
                                    : `Potongan ${formatRp(order.applied_voucher.discount_value)}`}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-green-600">
                                -{order.applied_voucher.discount_type === 'percentage'
                                  ? `${order.applied_voucher.discount_value}%`
                                  : formatRp(order.applied_voucher.discount_value)}
                              </span>
                            </div>
                          )}

                          {/* Total Discount Badge */}
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between items-center bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                              <span className="text-xs font-bold text-green-700">Total Hemat</span>
                              <span className="text-sm font-black text-green-700">-{formatRp(order.discount_amount)}</span>
                            </div>
                          )}

                          {!order.applied_promo_rule && !order.applied_voucher && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                              <span>Tidak ada diskon yang diterapkan</span>
                            </div>
                          )}

                          <Row label="Ongkos Kirim" value={formatRp(order.shipping_cost)} />
                          <div className="border-t border-gray-100 pt-2">
                            <Row label="Total Bayar" value={formatRp(order.final_amount)} valueClass="font-black text-blue-600 text-sm" />
                          </div>

                          {/* Shipping & Payment Info */}
                          <div className="border-t border-gray-100 pt-2 space-y-1">
                            <Row label="Kurir" value={`${order.courier_name?.toUpperCase() || '-'} · ${order.courier_service?.toUpperCase() || '-'}`} />
                            <Row label="Alamat" value={order.shipping_address || '-'} valueClass="text-xs text-gray-500" />
                            {order.awb_number && <Row label="AWB" value={order.awb_number} valueClass="font-mono font-bold text-indigo-600" />}
                            {order.payment_url && (
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-gray-400 text-xs flex-shrink-0">Link Bayar</span>
                                <a href={order.payment_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline truncate">Buka Xendit →</a>
                              </div>
                            )}
                          </div>
                        </div>
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

      {/* Confirm Modal */}
      <AdminModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.type === 'payment' ? 'Confirm Payment?' : 'Generate AWB?'}
        variant="centered"
        size="sm"
        footer={(
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setConfirmModal(null)} 
              className="flex-1 py-2.5 text-sm font-bold text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-all font-sans"
            >
              Cancel
            </button>
            <button 
              onClick={() => confirmModal.type === 'payment' ? confirmPayment(confirmModal.orderId) : generateAWB(confirmModal.orderId)}
              disabled={actionLoading != null}
              className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 text-sm font-sans"
            >
              {actionLoading ? 'Processing...' : (confirmModal?.type === 'payment' ? 'Confirm Payment' : 'Generate AWB')}
            </button>
          </div>
        )}
      >
        {confirmModal && (
          <div className="text-center space-y-6">
            <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center ${confirmModal.type === 'payment' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {confirmModal.type === 'payment'
                ? <CheckCircle size={40} weight="fill" />
                : <Truck size={40} weight="fill" />
              }
            </div>
            <div>
              <p className="text-gray-500 font-medium leading-relaxed">
                {confirmModal.type === 'payment'
                  ? `Confirm that payment for order ${confirmModal.orderNumber} has been received and mark it as Paid.`
                  : `Request a shipping AWB from Biteship for order ${confirmModal.orderNumber}. Order will be marked as Shipped.`
                }
              </p>
            </div>
          </div>
        )}
      </AdminModal>
    </>
  );
};

const Row = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-gray-400 text-xs flex-shrink-0">{label}</span>
    <span className={`text-right text-xs font-semibold text-gray-700 ${valueClass}`}>{value}</span>
  </div>
);

export default AdminOrders;
