import React, { useEffect, useState, useContext } from 'react';
import api, { getFullUrl } from '../utils/api';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { calculatePromoPrice } from '../utils/promoHelper';
import { useSettings } from '../context/SettingsContext';
import { 
  ShoppingCart, 
  Package, 
  CaretRight, 
  Star, 
  Cpu, 
  House, 
  DeviceMobile, 
  Broadcast, 
  PlugsConnected,
  ArrowRight,
  BookOpen
} from 'phosphor-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const { addToCart } = useCart();
  const { user } = useContext(AuthContext);
  const { settings } = useSettings();

  // Helper structure to map icons to category names
  const getCategoryIcon = (name, isActive) => {
    const weight = isActive ? "fill" : "light";
    const lowerName = name.toLowerCase();
    if (lowerName.includes('elect')) return <Cpu size={28} weight={weight} />;
    if (lowerName.includes('home')) return <House size={28} weight={weight} />;
    if (lowerName.includes('mobile')) return <DeviceMobile size={28} weight={weight} />;
    if (lowerName.includes('iot')) return <Broadcast size={28} weight={weight} />;
    if (lowerName.includes('access')) return <PlugsConnected size={28} weight={weight} />;
    return <Package size={28} weight={weight} />;
  };

  // Hero images and text are now dynamically loaded from `useSettings()`

  useEffect(() => {
    fetchCategories();
    fetchBlogs();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [activeCategory]);

  const fetchCategories = async () => {
    try {
        const res = await api.get('/catalog/categories');
        setCategories(res.data.data || []);
    } catch (err) {
        console.error("Failed to fetch categories", err);
    }
  };

  const fetchBlogs = async () => {
    setIsLoadingBlogs(true);
    try {
        const res = await api.get('/blogs?limit=3');
        setBlogs(res.data.data || []);
    } catch (err) {
        console.error("Failed to fetch blogs", err);
    } finally {
        setIsLoadingBlogs(false);
    }
  };

  const fetchCatalog = async () => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.append('category_id', activeCategory);
      params.append('sort', 'created_at');
      params.append('order', 'desc');

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
    <div className="space-y-12 md:space-y-20 animate-fade-in pb-20">
      {/* Premium Hero Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Large Banner */}
          <div className="lg:col-span-2 relative h-[400px] md:h-[550px] rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-[#050505] text-white flex items-center group shadow-2xl border border-white/5">
             {/* Animated Glow Blobs */}
             <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] bg-[#2B59FF]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none group-hover:bg-[#2B59FF]/30 transition-all duration-1000" />
             <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[50%] bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none group-hover:bg-purple-600/30 transition-all duration-1000" />
             
             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10 backdrop-blur-[2px]" />
             <div className="relative z-20 px-8 md:px-16 space-y-4 md:space-y-8 max-w-xl">
               <div className="flex items-center gap-3">
                 <span className="w-8 md:w-12 h-[2px] bg-gradient-to-r from-[#2B59FF] to-purple-500 rounded-full" />
                 <span className="text-[#2B59FF] font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px] drop-shadow-[0_0_8px_rgba(43,89,255,0.5)]">{settings.hero_main_subtitle}</span>
               </div>
               <h1 
                 className="text-3xl md:text-6xl font-black leading-[1.1] tracking-tighter" 
                 dangerouslySetInnerHTML={{ __html: settings.hero_main_title || 'New Arrival' }} 
               />
               <p className="text-gray-400 text-sm md:text-lg leading-relaxed font-medium line-clamp-2 md:line-clamp-none">{settings.hero_main_desc}</p>
               <a href={settings.hero_main_link || '#'} className="inline-flex items-center gap-3 px-6 md:px-10 py-3 md:py-4 bg-[#2B59FF]/10 border border-[#2B59FF]/30 hover:bg-[#2B59FF] hover:border-[#2B59FF] text-white text-sm md:text-base font-bold rounded-xl transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(43,89,255,0.15)] hover:shadow-[0_0_30px_rgba(43,89,255,0.4)] backdrop-blur-md">
                 {settings.hero_main_btn_text}
                 <CaretRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
               </a>
             </div>
             {settings.hero_main_image && (
               <img 
                  src={getFullUrl(settings.hero_main_image)} 
                  className="absolute right-[-15%] md:right-[-10%] bottom-0 h-[70%] md:h-[95%] object-contain mix-blend-screen transition-transform duration-1000 group-hover:scale-[1.15] group-hover:-rotate-2 drop-shadow-2xl z-10 filter contrast-125" 
                  alt="Main Banner"
                />
             )}
          </div>

          {/* Right Column Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8">
             <a href={settings.hero_side1_link || '#'} className="block relative rounded-2xl md:rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#1a1a1a] to-[#050505] overflow-hidden group shadow-xl h-[250px] md:flex-1 md:h-auto border border-white/5 hover:border-white/10 transition-colors">
               <div className="p-8 md:p-10 space-y-3 md:space-y-4 relative z-10">
                 {settings.hero_side1_badge && (
                   <div className="inline-block p-1 px-3 bg-gradient-to-r from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded-lg backdrop-blur-sm shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                      <span className="text-orange-400 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-xs">{settings.hero_side1_badge}</span>
                   </div>
                 )}
                 <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">{settings.hero_side1_title}</h2>
                 <p className="text-gray-400 font-bold text-xs md:text-sm">{settings.hero_side1_desc}</p>
                 <div className="text-xs md:text-sm font-black text-[#2B59FF] flex items-center gap-2 group-hover:gap-3 group-hover:text-white transition-all pt-2">
                    Learn more <CaretRight weight="bold" />
                 </div>
               </div>
               {settings.hero_side1_image && (
                 <img 
                   src={getFullUrl(settings.hero_side1_image)} 
                   className="absolute right-[-10%] bottom-[-5%] w-[60%] md:w-[80%] object-contain transition-transform duration-1000 group-hover:scale-110 group-hover:-rotate-6 drop-shadow-2xl z-0" 
                   alt="Side Banner 1"
                 />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
             </a>
             <a href={settings.hero_bottom_link || '#'} className="block h-44 relative rounded-2xl md:rounded-[2.5rem] bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex items-center p-8 md:p-10 cursor-pointer hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1">
                {settings.hero_bottom_image && (
                  <img src={getFullUrl(settings.hero_bottom_image)} className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-multiply group-hover:opacity-20 transition-opacity duration-700 group-hover:scale-105" alt="Bottom Banner" />
                )}
                <div className="space-y-2 relative z-10 w-full">
                  <h2 className="text-xl md:text-2xl font-black text-[#111827] tracking-tight group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">{settings.hero_bottom_title}</h2>
                  <p className="text-[#111827]/50 font-bold text-xs md:text-sm group-hover:text-[#111827]/70 transition-colors uppercase tracking-widest">{settings.hero_bottom_desc}</p>
                </div>
                {!settings.hero_bottom_image && (
                  <div className="absolute right-8 md:right-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-50/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl border border-white">
                     <Package size={32} weight="duotone" className="text-blue-500 md:w-[40px] md:h-[40px]" />
                  </div>
                )}
             </a>
          </div>
        </div>
      </section>

      {/* Categories Modern Grid Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="flex items-center gap-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Shop by Category</h3>
             <div className="flex-1 h-[1px] bg-gray-100" />
          </div>
          
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 md:grid md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 md:justify-items-center">
            {/* All Category */}
            <button 
              onClick={() => setActiveCategory(null)}
              className={`flex flex-col items-center gap-3 transition-all group shrink-0 w-20 md:w-full ${activeCategory === null ? 'scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
            >
               <div className={`w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 ${activeCategory === null ? 'bg-[#2B59FF] shadow-2xl shadow-blue-500/40 text-white' : 'bg-white shadow-sm border border-gray-100 text-gray-400 group-hover:shadow-lg'}`}>
                  <Star size={24} weight={activeCategory === null ? "fill" : "light"} className="md:w-[28px] md:h-[28px]" />
               </div>
               <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#111827] text-center ${activeCategory === null ? 'text-[#2B59FF]' : ''}`}>All</span>
            </button>

            {/* Dynamic Categories */}
            {categories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center gap-3 transition-all group shrink-0 w-20 md:w-full ${isActive ? 'scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                >
                   <div className={`w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[#2B59FF] shadow-2xl shadow-blue-500/40 text-white' : 'bg-white shadow-sm border border-gray-100 text-gray-400 group-hover:shadow-lg'}`}>
                      {getCategoryIcon(cat.name, isActive)}
                   </div>
                   <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#111827] text-center ${isActive ? 'text-[#2B59FF]' : ''}`}>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Grid with Dynamic Animation */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8 md:mb-12">
          <div className="space-y-1">
             <div className="w-8 md:w-12 h-1 bg-[#2B59FF] rounded-full" />
             <h2 className="text-2xl md:text-4xl font-black text-[#111827] tracking-tighter">
                {activeCategory ? categories.find(c => c.id === activeCategory)?.name : 'Featured Gadgets'}
             </h2>
          </div>
          <Link to="/shop" className="group flex items-center gap-2 text-[10px] md:text-xs font-black text-[#2B59FF] hover:-translate-x-1 transition-all uppercase tracking-widest">
            View All <CaretRight weight="bold" />
          </Link>
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-square bg-gray-100 rounded-3xl md:rounded-[3rem]" />
                <div className="h-4 bg-gray-100 rounded-full w-3/4 mx-2 md:mx-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-10">
            {products.slice(0, 8).map((product, idx) => (
              <Link 
                to={`/product/${product.slug}`}
                key={product.id} 
                className={`group block animate-fade-in-up stagger-${(idx % 8) + 1}`}
              >
                <div className="aspect-[4/5] bg-white rounded-2xl md:rounded-[2.5rem] mb-4 md:mb-6 overflow-hidden relative flex items-center justify-center p-4 md:p-12 transition-all duration-700 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 md:group-hover:-translate-y-4 shadow-sm border border-gray-50">
                  {product.image_urls?.[0] ? (
                    <img src={getFullUrl(product.image_urls[0])} alt={product.name} className="max-h-[80%] md:max-h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-xl" />
                  ) : (
                    <Package size={48} weight="thin" className="text-gray-200 md:w-[64px] md:h-[64px]" />
                  )}
                  
                  {/* Action Overlay */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product);
                    }}
                    className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-10 h-10 md:w-14 md:h-14 bg-[#111827] text-white rounded-lg md:rounded-xl flex items-center justify-center shadow-2xl md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-500 hover:bg-[#2B59FF] hover:scale-110 active:scale-95"
                  >
                    <ShoppingCart size={18} weight="bold" className="md:w-[24px] md:h-[24px]" />
                  </button>
                </div>

                <div className="px-2 md:px-4 space-y-1 md:space-y-3">
                  <h3 className="text-sm md:text-lg font-black text-[#111827] group-hover:text-[#2B59FF] transition-colors line-clamp-1 leading-none tracking-tight">{product.name}</h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <span className="text-base md:text-xl font-black text-[#111827]">
                      Rp {calculatePromoPrice(product, user).effectivePrice?.toLocaleString('id-ID')}
                    </span>
                    {calculatePromoPrice(product, user).isSale && (
                      <span className="text-[10px] md:text-xs text-gray-400 line-through font-bold">Rp {product.base_price?.toLocaleString('id-ID')}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Blog Section */}
      <section className="bg-gray-50/50 py-12 md:py-20 border-t border-gray-100">
         <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8 md:mb-12">
              <div className="space-y-1">
                 <div className="w-8 md:w-12 h-1 bg-[#2B59FF] rounded-full" />
                 <h2 className="text-2xl md:text-4xl font-black text-[#111827] tracking-tighter">Latest Stories.</h2>
              </div>
            </div>

            {isLoadingBlogs ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="aspect-[16/10] bg-gray-200 rounded-2xl md:rounded-[2rem]" />
                    <div className="h-4 bg-gray-200 rounded-full w-full" />
                  </div>
                ))}
              </div>
            ) : blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {blogs.map((blog, idx) => (
                  <Link 
                    key={blog.id} 
                    to={`/blogs/${blog.id}`}
                    className={`group block bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 animate-fade-in-up stagger-${(idx % 3) + 1}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                       {blog.image_url ? (
                         <img src={getFullUrl(blog.image_url)} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <BookOpen size={40} weight="thin" />
                         </div>
                       )}
                    </div>
                    <div className="p-6 md:p-8 space-y-3 md:space-y-4">
                       <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-[#2B59FF]">
                          {new Date(blog.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                       </span>
                       <h3 className="text-base md:text-xl font-black text-[#111827] leading-tight group-hover:text-[#2B59FF] transition-colors line-clamp-2">{blog.title}</h3>
                       <p className="text-gray-500 text-xs md:text-sm font-medium line-clamp-2 leading-relaxed">{blog.excerpt || blog.content}</p>
                       <div className="pt-1 text-xs md:text-sm font-black text-[#111827] flex items-center gap-2 group-hover:gap-3 group-hover:text-[#2B59FF] transition-all">
                         Read Article <ArrowRight weight="bold" />
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
         </div>
      </section>

      {/* Premium Stats Strip */}
      <section className="bg-white py-12 md:py-20 border-y border-gray-100">
         <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center md:text-left">
            {[
              { l: 'Express Shipping', d: 'Secure delivery to your door' },
              { l: 'Verified Quality', d: '100% Genuine electronics' },
              { l: 'Premium Support', d: '24/7 dedicated assistance' },
              { l: 'Safe Payment', d: 'Encryption across all transactions' }
            ].map((s, i) => (
              <div key={i} className="space-y-1 md:space-y-2">
                 <h4 className="text-xs md:text-sm font-black text-[#111827] uppercase tracking-wider">{s.l}</h4>
                 <p className="text-gray-400 text-xs md:text-sm font-medium">{s.d}</p>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default Home;
