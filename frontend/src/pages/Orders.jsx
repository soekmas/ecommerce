import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, XCircle, Receipt } from 'phosphor-react';
import api, { getFullUrl } from '../utils/api';
import Button from '../components/Button';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/user/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'Pending Payment', icon: <Clock className="text-orange-500" />, color: 'bg-orange-50 text-orange-700 border-orange-100' };
      case 'paid':
        return { label: 'Paid', icon: <CheckCircle className="text-blue-500" />, color: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'processing':
        return { label: 'Processing', icon: <Package className="text-purple-500" />, color: 'bg-purple-50 text-purple-700 border-purple-100' };
      case 'shipped':
        return { label: 'Shipped', icon: <Truck className="text-blue-500" />, color: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'delivered':
        return { label: 'Delivered', icon: <CheckCircle className="text-green-500" />, color: 'bg-green-50 text-green-700 border-green-100' };
      case 'cancelled':
        return { label: 'Cancelled', icon: <XCircle className="text-red-500" />, color: 'bg-red-50 text-red-700 border-red-100' };
      default:
        return { label: status, icon: <Clock />, color: 'bg-gray-50 text-gray-700 border-gray-100' };
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order History</h1>
          <p className="text-gray-500 mt-1">Track and manage your recent purchases</p>
        </div>
        <Receipt size={40} weight="duotone" className="text-blue-600 opacity-20" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Receipt size={40} className="text-gray-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">No orders yet</h3>
            <p className="text-gray-500 mt-2">Looks like you haven't made any purchases yet.</p>
          </div>
          <Link to="/">
            <Button variant="primary">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = getStatusConfig(order.status);
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Order Header */}
                <div className="p-6 sm:p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <Receipt size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Number</p>
                      <p className="text-sm font-bold text-gray-900">{order.order_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</p>
                      <p className="text-sm font-medium text-gray-700">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-tight ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 group/item">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover/item:border-blue-200 transition-colors overflow-hidden">
                           {item.product?.image_urls?.[0] ? (
                             <img src={getFullUrl(item.product.image_urls[0])} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <Package size={24} className="text-gray-400" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{item.product?.name || 'Product'}</p>
                          <p className="text-xs text-gray-500">{item.quantity} x {formatPrice(item.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Footer */}
                  <div className="pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dikirim ke</p>
                        <p className="text-sm text-gray-600 max-w-xs">{order.shipping_address}</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Kurir</p>
                          <p className="text-sm text-gray-800 font-medium">{order.courier_name?.toUpperCase() || '-'} · {order.courier_service?.toUpperCase() || '-'}</p>
                        </div>
                        {order.awb_number && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">No. Resi (AWB)</p>
                            <p className="text-sm text-indigo-600 font-bold font-mono bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                              {order.awb_number}
                            </p>
                          </div>
                        )}
                      </div>
                      {order.payment_url && order.status === 'pending_payment' && (
                        <div className="pt-2">
                           <a href={order.payment_url} target="_blank" rel="noreferrer" className="inline-block bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                             Bayar Sekarang →
                           </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm md:text-right bg-gray-50/50 p-4 rounded-2xl border border-gray-50 self-start">
                      <div className="flex justify-between md:justify-end gap-8 text-gray-500">
                        <span>Subtotal Produk</span>
                        <span className="font-bold text-gray-900">{formatPrice(order.total_amount)}</span>
                      </div>
                      {(order.applied_promo_rule || order.applied_voucher) && (
                        <div className="flex flex-col gap-1 md:items-end mb-1 mt-1">
                          {order.applied_promo_rule && (
                            <div className="text-xs text-purple-600 flex justify-between md:justify-end gap-8">
                              <span className="opacity-80">Promo: {order.applied_promo_rule.name}</span>
                            </div>
                          )}
                          {order.applied_voucher && (
                            <div className="text-xs text-green-600 flex justify-between md:justify-end gap-8">
                              <span className="opacity-80">Voucher: {order.applied_voucher.code}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between md:justify-end gap-8 text-green-600">
                          <span className="font-medium">Total Potongan Diskon</span>
                          <span className="font-bold">-{formatPrice(order.discount_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between md:justify-end gap-8 text-gray-500">
                        <span>Ongkos Kirim</span>
                        <span className="font-bold text-gray-900">{formatPrice(order.shipping_cost)}</span>
                      </div>
                      <div className="flex justify-between md:justify-end gap-8 pt-3 border-t border-gray-200 mt-3 items-center">
                        <span className="font-bold text-gray-700">Total Belanja</span>
                        <span className="text-xl font-black text-blue-600">{formatPrice(order.final_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
