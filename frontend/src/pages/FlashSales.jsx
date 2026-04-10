import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getFullUrl } from '../utils/api';
import { useCart } from '../context/CartContext';
import { 
  SquaresFour, List, 
  ShoppingCart, Star, 
  House, Lightning, 
  Fire, Package,
  Clock
} from 'phosphor-react';

const FlashSales = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchCategories();
    fetchFlashSales();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/catalog/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFlashSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');
      const response = await api.get(`/catalog/products?${params.toString()}`);
      const all = response.data.data || [];
      // Filter only items with special price
      const onSale = all.filter(p => p.special_price && p.special_price > 0 && p.special_price < p.base_price);
      setProducts(onSale);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = activeCategory 
    ? products.filter(p => p.category_id === activeCategory)
    : products;

  return (
    <div className="animate-fade-in bg-white min-h-screen pb-20">
      {/* ── TOP FLASH SALE HEADER ── */}
      <div className="bg-white border-b border-gray-100 py-10 mb-10 overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 animate-bounce">
                <Lightning size={32} weight="fill" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#111827] tracking-tighter">Flash Sales Catalog</h1>
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">Limited Time Offers</p>
              </div>
           </div>
           <div className="flex items-center gap-2 text-sm font-medium">
              <Link to="/" className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <House size={16} /> Home
              </Link>
              <span className="text-gray-200">/</span>
              <span className="text-red-600 font-bold">Special Deals</span>
           </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          
          {/* ── LEFT SIDEBAR ── */}
          <aside className="space-y-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-black text-[#111827] mb-8 pb-4 border-b border-gray-50 flex items-center gap-2">
                <Fire size={24} weight="fill" className="text-orange-500" /> Hot Categories
              </h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setActiveCategory(null)}
                  className={`flex justify-between items-center w-full text-left font-bold transition-all ${!activeCategory ? 'text-[#2B59FF]' : 'text-gray-500 hover:text-[#111827]'}`}
                >
                  <span>All Sales</span>
                  <span className="text-xs opacity-50">({products.length})</span>
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex justify-between items-center w-full text-left font-bold transition-all ${activeCategory === cat.id ? 'text-[#2B59FF]' : 'text-gray-500 hover:text-[#111827]'}`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Promo Card */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-2xl p-8 text-white relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                  <h3 className="text-2xl font-black leading-tight">Don't Miss<br/>The Deal!</h3>
                  <p className="text-gray-400 text-xs font-bold leading-relaxed">Exclusive discounts for loyal customers.</p>
                  <div className="pt-2">
                    <div className="flex gap-2">
                       <span className="bg-white/10 px-2 py-1 rounded-lg text-xs font-black">24H</span>
                       <span className="bg-white/10 px-2 py-1 rounded-lg text-xs font-black">LEFT</span>
                    </div>
                  </div>
               </div>
               <Lightning size={80} weight="fill" className="absolute -bottom-4 -right-4 text-white/5 group-hover:scale-125 transition-transform duration-700" />
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 pb-6 border-b border-gray-50">
               <p className="text-sm font-bold text-gray-400">
                  Showing <span className="text-red-500">{filteredProducts.length}</span> limited time deals
               </p>
               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                     <button className="p-2 text-gray-400 hover:text-[#111827] transition-colors"><List size={20} weight="bold" /></button>
                     <button className="p-2 bg-white text-red-500 shadow-sm rounded-lg border border-gray-100"><SquaresFour size={20} weight="fill" /></button>
                  </div>
               </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse bg-gray-50 rounded-3xl h-[400px]" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                 <Lightning size={64} weight="fill" className="mx-auto text-gray-200 mb-4" />
                 <p className="text-gray-400 font-bold">No flash sales in this category right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                  const discount = Math.round((1 - (product.special_price / product.base_price)) * 100);
                  return (
                    <div 
                      key={product.id}
                      className="group bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col"
                    >
                      {/* Image Container */}
                      <Link to={`/product/${product.slug}`} className="relative bg-white border border-gray-50 rounded-lg aspect-square overflow-hidden mb-6 flex items-center justify-center p-8">
                         {product.image_urls && product.image_urls.length > 0 ? (
                            <img 
                              src={getFullUrl(product.image_urls[0])} 
                              alt={product.name} 
                              className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                            />
                         ) : (
                            <Package size={48} className="text-gray-100" />
                         )}
                         {/* Discount Badge */}
                         <div className="absolute top-4 left-4 flex flex-col gap-1">
                            <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-lg shadow-lg">
                               SAVE {discount}%
                            </span>
                         </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 px-2 space-y-3">
                         <Link to={`/product/${product.slug}`} className="block">
                            <h3 className="font-black text-[#111827] group-hover:text-[#2B59FF] transition-colors line-clamp-2 leading-tight">
                               {product.name}
                            </h3>
                         </Link>
                         
                         {/* Progress Bar (Stock) */}
                         <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                               <span>Sold: {Math.min(10, product.stock)}/40</span>
                               <span className="text-red-500">Only {product.stock} Left</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                               <div className="h-full bg-red-500 w-[40%] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            </div>
                         </div>

                         {/* Price Block */}
                         <div className="flex items-center gap-2 pt-2">
                            <span className="text-gray-300 line-through text-sm font-bold">
                               Rp {product.base_price.toLocaleString()}
                            </span>
                            <span className="text-xl font-black text-red-500 tracking-tighter">
                               Rp {product.special_price.toLocaleString()}
                            </span>
                         </div>
                      </div>

                      {/* Add to Cart Footer */}
                      <div className="pt-6 px-2">
                         <button 
                            onClick={() => addToCart(product)}
                            className="w-full bg-gray-50 hover:bg-[#2B59FF] hover:text-white text-[#111827] py-3.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                         >
                            Add To Cart <ShoppingCart size={18} weight="bold" />
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default FlashSales;
