import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, XCircle, Receipt, ArrowRight } from 'phosphor-react';
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
    <div className="max-w-[1200px] mx-auto px-6 py-12 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-2">
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-[#111827] tracking-tighter">Your Orders.</h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em]">Tracking Innovation from our gallery to your door.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
           <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#2B59FF]">
              <Package size={24} weight="bold" />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Purchases</p>
              <p className="text-xl font-black text-[#111827] leading-none">{orders.length}</p>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="w-12 h-12 border-[3px] border-[#2B59FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Syncing orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-xl shadow-gray-100/50 space-y-10 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
            <Receipt size={48} weight="thin" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-[#111827] tracking-tight">The gallery is waiting.</h3>
            <p className="text-gray-400 font-medium text-lg leading-relaxed px-10">You haven't made any purchases yet. Explore our latest arrivals and start your journey.</p>
          </div>
          <Link to="/shop" className="inline-block">
            <button className="px-12 py-5 bg-[#2B59FF] text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95 text-sm tracking-widest uppercase">
              Browse Catalog
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {orders.map((order, idx) => {
            const status = getStatusConfig(order.status);
            // Replace generic colors with themed ones for the component
            const themedStatus = {
              ...status,
              color: order.status === 'pending_payment' 
                ? 'bg-blue-50 text-[#2B59FF] border-blue-100' 
                : order.status === 'delivered' 
                  ? 'bg-green-50 text-green-600 border-green-100' 
                  : order.status === 'cancelled'
                    ? 'bg-red-50 text-red-500 border-red-100'
                    : 'bg-blue-50 text-[#2B59FF] border-blue-100'
            };

            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden group animate-fade-in-up stagger-${(idx % 6) + 1}`}
              >
                {/* Order Header */}
                <div className="p-8 sm:p-10 border-b border-gray-50 flex flex-wrap items-center justify-between gap-8 bg-blue-50/20">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-[#2B59FF]">
                      <Receipt size={28} weight="bold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Receipt ID</p>
                      <p className="text-lg font-black text-[#111827] tracking-tight">{order.order_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-10">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authorized On</p>
                      <p className="text-sm font-bold text-gray-800 tracking-tight">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${themedStatus.color}`}>
                      {React.cloneElement(themedStatus.icon, { size: 16, weight: "bold" })}
                      {themedStatus.label}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-8 sm:p-10 space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-8">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Product Details</p>
                        <div className="space-y-6">
                            {order.items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-6 group/item">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover/item:border-[#2B59FF]/20 transition-all overflow-hidden flex-shrink-0">
                                {item.product?.image_urls?.[0] ? (
                                    <img src={getFullUrl(item.product.image_urls[0])} alt="" className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover/item:scale-110" />
                                ) : (
                                    <Package size={24} weight="thin" className="text-gray-300" />
                                )}
                                </div>
                                <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-[#111827] truncate tracking-tight">{item.product?.name || 'Product'}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.quantity} x {formatPrice(item.price)}</p>
                                </div>
                                <div className="text-right">
                                <p className="text-sm font-black text-[#111827] tracking-tight">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                            </div>
                            ))}
                        </div>

                        <div className="pt-8 space-y-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Shipping Info</p>
                            <div className="flex flex-col sm:flex-row gap-10">
                                <div className="flex-1 space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Destination</p>
                                    <p className="text-xs font-bold text-gray-600 leading-relaxed max-w-xs">{order.shipping_address}</p>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Logistics</p>
                                        <p className="text-xs font-black text-[#111827] flex items-center gap-2">
                                            <Truck size={14} weight="bold" className="text-[#2B59FF]" />
                                            {order.courier_name?.toUpperCase() || '-'} · {order.courier_service?.toUpperCase() || '-'}
                                        </p>
                                    </div>
                                    {order.awb_number && (
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Tracking Number</p>
                                            <p className="text-xs font-black text-[#2B59FF] bg-blue-50 px-3 py-1 rounded-lg inline-block tracking-widest border border-blue-100">
                                                {order.awb_number}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                       <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">Amount Summary</p>
                          
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-widest">Bag Subtotal</span>
                                <span className="font-black text-[#111827]">{formatPrice(order.total_amount)}</span>
                            </div>
                            
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-green-500 uppercase tracking-widest">Promotion Applied</span>
                                    <span className="font-black text-green-500">-{formatPrice(order.discount_amount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-widest">Delivery Fee</span>
                                <span className="font-black text-[#111827]">{formatPrice(order.shipping_cost)}</span>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-between items-baseline">
                                <span className="text-2xl font-black text-[#111827] tracking-tighter">Grand Total.</span>
                                <span className="text-2xl font-black text-[#2B59FF] tracking-tighter">{formatPrice(order.final_amount)}</span>
                            </div>
                          </div>

                          {order.payment_url && order.status === 'pending_payment' && (
                             <div className="pt-4">
                                <a href={order.payment_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-[#2B59FF] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                                   Complete Payment Now <ArrowRight size={14} weight="bold" />
                                </a>
                             </div>
                          )}
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
