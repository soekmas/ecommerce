import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getFullUrl } from '../utils/api';
import Button from '../components/Button';
import { Trash, Minus, Plus, ShoppingBag, ArrowRight, Package } from 'phosphor-react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-32 text-center animate-fade-in">
        <h2 className="text-[40px] font-semibold text-[#1d1d1f] mb-2 tracking-tight">Your bag is empty.</h2>
        <p className="text-[#86868b] text-lg mb-8 tracking-tight">Check out our latest products and start shopping.</p>
        <Link to="/">
          <button className="px-8 py-3 bg-[#0071e3] text-white text-[17px] font-medium rounded-2xl hover:bg-[#0077ed] transition-all">
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 animate-fade-in pb-32">
      <div className="py-12 border-b border-gray-100">
        <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">Review your bag.</h1>
        <p className="text-[#86868b] text-lg mt-2 tracking-tight">Free delivery on every order.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-12 items-start">
        {/* Cart Items - Apple Style */}
        <div className="lg:col-span-8 space-y-12">
          {cart.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-8 pb-12 border-b border-gray-100 last:border-0">
              {/* Product Image */}
              <div className="w-full sm:w-48 aspect-square bg-[#fbfbfd] rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.image_urls?.[0] ? (
                  <img src={getFullUrl(item.image_urls[0])} alt={item.name} className="w-full h-full object-contain p-4 mix-blend-multiply" />
                ) : (
                  <Package size={48} weight="thin" className="text-gray-200" />
                )}
              </div>
              
              {/* Product Details */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <Link to={`/product/${item.id}`} className="text-2xl font-semibold text-[#1d1d1f] hover:text-[#0071e3] transition-colors tracking-tight">
                      {item.name}
                    </Link>
                    <p className="text-[13px] font-medium text-[#bf4800] uppercase tracking-widest leading-none">In Stock</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-medium text-[#1d1d1f]">
                      Rp {((item.effective_price ?? item.base_price) * item.quantity).toLocaleString('id-ID')}
                    </p>
                    {item.quantity > 1 && (
                       <p className="text-[13px] text-[#86868b]">
                         Rp {(item.effective_price ?? item.base_price).toLocaleString('id-ID')} each
                       </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center bg-[#f5f5f7] rounded-full p-1 h-9">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-9 h-full flex items-center justify-center text-[#1d1d1f] hover:bg-white hover:shadow-sm rounded-full transition-all"
                    >
                      <Minus size={14} weight="bold" />
                    </button>
                    <span className="w-8 text-center font-semibold text-[14px] text-[#1d1d1f]">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-full flex items-center justify-center text-[#1d1d1f] hover:bg-white hover:shadow-sm rounded-full transition-all"
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-[#0071e3] hover:underline text-[15px] font-medium transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary - Clean Sticky Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-[17px] text-[#1d1d1f]">
                <span className="text-[#86868b]">Subtotal</span>
                <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[17px] text-[#1d1d1f]">
                <span className="text-[#86868b]">Shipping</span>
                <span className="text-[#32d74b]">FREE</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-between items-baseline mb-8">
              <span className="text-[24px] font-semibold text-[#1d1d1f]">Total</span>
              <span className="text-[24px] font-semibold text-[#1d1d1f]">Rp {cartTotal.toLocaleString('id-ID')}</span>
            </div>

            <Link to="/checkout" className="block">
              <button className="w-full py-4 bg-[#0071e3] text-white text-[17px] font-medium rounded-2xl hover:bg-[#0077ed] active:scale-[0.98] transition-all">
                Check Out
              </button>
            </Link>
            
            <p className="text-[12px] text-[#86868b] text-center px-4">
              Secure checkout with industry-standard encryption. Taxes calculated at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
