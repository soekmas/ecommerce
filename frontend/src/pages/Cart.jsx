import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { getFullUrl } from '../utils/api';
import { calculateItemTotal, calculatePromoPrice } from '../utils/promoHelper';
import { Trash, Minus, Plus, ShoppingBag, ArrowRight, Package, Truck, ShieldCheck, CaretLeft, CaretRight } from 'phosphor-react';

const Cart = () => {
  const { user } = React.useContext(AuthContext);
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-40 text-center animate-fade-in flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-10">
           <ShoppingBag size={48} weight="thin" className="text-gray-300" />
        </div>
        <h2 className="text-5xl font-black text-[#111827] mb-4 tracking-tighter">Your bag is empty.</h2>
        <p className="text-gray-400 text-lg mb-10 font-medium max-w-md">Find your next piece of innovation. Browse our latest arrivals and fill your bag with excellence.</p>
        <Link to="/shop">
          <button className="px-12 py-4 bg-[#2B59FF] text-white font-black rounded-full hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto px-6 animate-fade-in pb-32 pt-12">
      {/* Breadcrumbs */}
      <div className="py-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
         <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
         <CaretRight size={10} />
         <Link to="/shop" className="hover:text-gray-900 transition-colors">Shop</Link>
         <CaretRight size={10} />
         <span className="text-gray-900">Bag</span>
      </div>

      {/* Header Area */}
      <div className="py-12 space-y-3">
        <h1 className="text-5xl font-black text-[#111827] tracking-tighter">Your Bag.</h1>
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Innovation is just one decision away.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Product List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            {cart.map((item, idx) => (
              <div 
                key={item.id} 
                className={`group flex flex-col sm:flex-row gap-8 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 animate-fade-in-up stagger-${(idx % 6) + 1}`}
              >
                {/* Product Box */}
                <Link 
                  to={`/product/${item.id}`}
                  className="w-full sm:w-40 aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:bg-blue-50/30 transition-colors border border-gray-50"
                >
                  {item.image_urls?.[0] ? (
                    <img src={getFullUrl(item.image_urls[0])} alt={item.name} className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <Package size={48} weight="thin" className="text-gray-200" />
                  )}
                </Link>
                
                {/* Details Column */}
                <div className="flex-1 flex flex-col py-1">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="space-y-1">
                      <Link to={`/product/${item.id}`} className="text-xl font-black text-[#111827] hover:text-[#2B59FF] transition-colors tracking-tight line-clamp-1">
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ships within 24 hours</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-black text-[#111827] tracking-tight">
                        Rp {calculateItemTotal(item, item.quantity, user).toLocaleString('id-ID')}
                      </p>
                      {(() => {
                        const promo = calculatePromoPrice(item, user);
                        const isSplit = promo.isSale && item.special_price_max_qty > 0 && item.quantity > item.special_price_max_qty;
                        if (isSplit) {
                          return (
                            <p className="text-[10px] font-bold text-[#2B59FF] mt-1 italic uppercase tracking-wider">
                              {item.special_price_max_qty} Promo + {item.quantity - item.special_price_max_qty} Regular
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    {/* Stepper */}
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-4 border border-gray-100">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#2B59FF] hover:bg-white rounded-lg transition-all"
                      >
                        <Minus size={14} weight="bold" />
                      </button>
                      <span className="w-4 text-center font-black text-sm text-[#111827]">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#2B59FF] hover:bg-white rounded-lg transition-all"
                      >
                        <Plus size={14} weight="bold" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2"
                      title="Remove from bag"
                    >
                      <Trash weight="bold" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link to="/shop" className="inline-flex items-center gap-2 py-4 px-8 rounded-full bg-white border border-gray-100 text-[#111827] hover:border-[#2B59FF] hover:text-[#2B59FF] transition-all group">
             <CaretLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-widest">Back to Gallery</span>
          </Link>
        </div>

        {/* Right: Summary Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 space-y-8 border border-gray-100 shadow-xl shadow-gray-100/50">
            <h2 className="text-2xl font-black text-[#111827] tracking-tight">Summary.</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                 <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Bag Subtotal</span>
                 <span className="font-black text-[#111827]">Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                 <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Estimated Shipping</span>
                 <span className="font-black text-green-500 uppercase text-[10px]">Free Delivery</span>
              </div>

              <div className="h-[1px] bg-gray-50" />

              <div className="flex justify-between items-baseline pt-4">
                <span className="text-3xl font-black text-[#111827] tracking-tighter">Total.</span>
                <span className="text-3xl font-black text-[#2B59FF] tracking-tighter">Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <Link to="/checkout" className="block">
              <button className="group w-full py-5 bg-[#2B59FF] text-white text-sm font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3">
                Proceed to Checkout
                <ArrowRight weight="bold" className="group-hover:translate-x-1 transition-transform text-white/70" />
              </button>
            </Link>
            
            <div className="flex items-center justify-center gap-2 opacity-30 pt-2">
               <ShieldCheck size={14} weight="bold" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Certified Secure</span>
            </div>
          </div>

          {/* Extra Help Card */}
          <div className="bg-blue-50/50 border border-blue-100/50 rounded-[2rem] p-8 space-y-3">
             <div className="flex items-center gap-3">
                <Truck weight="bold" size={18} className="text-[#2B59FF]" />
                <h4 className="text-[10px] font-black text-[#2B59FF] uppercase tracking-widest">Premium Support</h4>
             </div>
             <p className="text-[11px] font-medium text-gray-500 leading-relaxed">Experience our world-class concierge service for every purchase.</p>
             <button className="text-[10px] font-black text-[#2B59FF] uppercase tracking-widest border-b border-[#2B59FF]/20 hover:border-[#2B59FF] transition-all pb-0.5">Contact Concierge</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
