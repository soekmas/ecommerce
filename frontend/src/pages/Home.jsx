import React, { useEffect, useState } from 'react';
import api, { getFullUrl } from '../utils/api';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { MagnifyingGlass, Funnel, SortAscending, ShoppingCart, Tag, Package } from 'phosphor-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    min_price: '',
    max_price: '',
    sort: 'created_at',
    order: 'desc'
  });
  const { addToCart } = useCart();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchCatalog();
    }, 500); // debounce search
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchCategories = async () => {
    try {
        const res = await api.get('/catalog/categories');
        setCategories(res.data.data || []);
    } catch (err) {
        console.error("Failed to fetch categories", err);
    }
  };

  const fetchCatalog = async () => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);

      const response = await api.get(`/catalog/products?${params.toString()}`);
      if (response.data && response.data.data) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load catalog", error);
    } finally {
      setIsLoadingProducts(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in pb-20">
      {/* Hero Section: 2/3 + 1/3 Grid */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Large Banner */}
          <div className="lg:col-span-2 relative h-[500px] rounded-[2rem] overflow-hidden bg-[#0A101F] text-white flex items-center group">
             <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10" />
             <div className="relative z-20 px-12 space-y-6 max-w-xl">
               <span className="text-[#2B59FF] font-bold uppercase tracking-widest text-xs">Special Edition</span>
               <h1 className="text-5xl font-extrabold leading-tight">Apple AirPods Max</h1>
               <p className="text-gray-400 text-lg leading-relaxed">Transparency mode, and spatial audio, it delivers a premium listening experience.</p>
               <button className="px-10 py-3.5 bg-[#2B59FF] hover:bg-blue-600 text-white font-bold rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
                 Shop Now
               </button>
             </div>
             <img 
               src="https://demo.nextmerce.com/_next/image?url=%2Fassets%2Fimg%2Fhero%2Fhero-1.png&w=1920&q=75" 
               className="absolute right-0 bottom-0 h-[90%] object-contain mix-blend-lighten pointer-events-none transition-transform duration-700 group-hover:scale-105" 
               alt="AirPods Max"
             />
          </div>

          {/* Right Column Stack */}
          <div className="flex flex-col gap-6">
             <div className="flex-1 relative rounded-[2rem] bg-[#D4E4EC] overflow-hidden group">
               <div className="p-8 space-y-3 relative z-10">
                 <h2 className="text-2xl font-bold text-[#111827]">Smart Security Home Camera</h2>
                 <p className="text-[#111827]/70 font-semibold">Save up to <span className="text-[#2B59FF]">$450</span></p>
               </div>
               <img 
                 src="https://demo.nextmerce.com/_next/image?url=%2Fassets%2Fimg%2Fhero%2Fhero-2.png&w=640&q=75" 
                 className="absolute right-4 bottom-4 w-40 object-contain transition-transform duration-500 group-hover:scale-110" 
                 alt="CCTV"
               />
             </div>
             <div className="flex-1 relative rounded-[2rem] bg-[#ECE0D6] overflow-hidden group">
                <div className="p-8 space-y-3 relative z-10">
                  <h2 className="text-2xl font-bold text-[#111827]">Galaxy S24 Ultra 5G</h2>
                  <p className="text-[#111827]/70 font-semibold">Limited time offer</p>
                </div>
                <img 
                  src="https://demo.nextmerce.com/_next/image?url=%2Fassets%2Fimg%2Fhero%2Fhero-3.png&w=640&q=75" 
                  className="absolute right-4 bottom-4 w-40 object-contain transition-transform duration-500 group-hover:scale-110" 
                  alt="S24 Ultra"
                />
             </div>
          </div>
        </div>
      </section>

      {/* Categories Icons Strip */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-2">
          {categories.slice(0, 8).map(cat => (
            <button key={cat.id} className="flex flex-col items-center gap-3 group shrink-0">
               <div className="w-20 h-20 rounded-full bg-[#F3F4F6] flex items-center justify-center transition-all duration-300 group-hover:bg-[#2B59FF] group-hover:shadow-xl group-hover:shadow-blue-500/20 group-hover:-translate-y-1">
                  <Package size={32} weight="light" className="text-gray-400 group-hover:text-white transition-colors" />
               </div>
               <span className="text-xs font-bold text-[#111827] group-hover:text-[#2B59FF] transition-colors">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">Best Sellers</h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-[#2B59FF] hover:underline transition-all">View All Products</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-square bg-gray-100 rounded-3xl" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.slice(0, 8).map((product, idx) => (
              <Link 
                to={`/product/${product.id}`}
                key={product.id} 
                className={`group block animate-fade-in-up stagger-${(idx % 4) + 1}`}
              >
                <div className="aspect-square bg-[#F3F4F6] rounded-[2rem] mb-4 overflow-hidden relative flex items-center justify-center p-8 transition-all duration-500 group-hover:bg-gray-200">
                  {product.image_urls?.[0] ? (
                    <img src={getFullUrl(product.image_urls[0])} alt={product.name} className="max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <Package size={48} weight="thin" className="text-gray-300" />
                  )}
                  
                  {/* Action Overlay */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product);
                    }}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#2B59FF] hover:text-white"
                  >
                    <ShoppingCart size={20} weight="bold" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#2B59FF] transition-colors line-clamp-2 leading-snug">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-black text-[#111827]">
                      Rp {product.special_price?.toLocaleString('id-ID') || product.base_price?.toLocaleString('id-ID')}
                    </span>
                    {product.special_price && (
                      <span className="text-xs text-gray-400 line-through">Rp {product.base_price?.toLocaleString('id-ID')}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Promotional Countdown Banner */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative h-[450px] rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#E0F2FE] to-[#F0FDFA] flex items-center p-12 group">
          <div className="relative z-10 space-y-8 max-w-xl">
            <span className="text-[#2B59FF] font-bold uppercase tracking-widest text-xs">Don't Miss!!</span>
            <h2 className="text-5xl font-extrabold text-[#111827] leading-tight">Enhance Your Music Experience</h2>
            
            {/* Simple Countdown Row */}
            <div className="flex gap-4">
              {[ {l: 'Days', v: '06'}, {l: 'Hours', v: '09'}, {l: 'Mins', v: '25'}, {l: 'Secs', v: '53'} ].map(t => (
                <div key={t.l} className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-xl font-black text-[#111827]">{t.v}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{t.l}</span>
                </div>
              ))}
            </div>

            <button className="px-10 py-3.5 bg-[#2B59FF] hover:bg-blue-600 text-white font-bold rounded-full transition-all shadow-lg shadow-blue-500/20">
              Check it Out!
            </button>
          </div>
          <img 
            src="https://demo.nextmerce.com/_next/image?url=%2Fassets%2Fimg%2Fhero%2Fhero-1.png&w=1920&q=75" 
            className="absolute right-12 h-4/5 object-contain rotate-12 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-0" 
            alt="Promo"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
