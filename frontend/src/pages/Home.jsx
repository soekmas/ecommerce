import React, { useEffect, useState } from 'react';
import api, { getFullUrl } from '../utils/api';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
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

  // New generated images paths
  const HERO_IMAGE_MAIN = "/hero_banner_iphone_1775018828339.png";
  const HERO_IMAGE_WATCH = "/hero_banner_watch_1775019052766.png";

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
    <div className="space-y-20 animate-fade-in pb-20">
      {/* Premium Hero Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Large Banner */}
          <div className="lg:col-span-2 relative h-[550px] rounded-[3rem] overflow-hidden bg-[#050505] text-white flex items-center group shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
             <div className="relative z-20 px-16 space-y-8 max-w-xl">
               <div className="flex items-center gap-3">
                 <span className="w-12 h-[2px] bg-[#2B59FF]" />
                 <span className="text-[#2B59FF] font-black uppercase tracking-[0.3em] text-[10px]">New Arrival</span>
               </div>
               <h1 className="text-6xl font-black leading-[1.1] tracking-tighter">
                 iPhone 15 Pro.<br />
                 <span className="text-gray-400">Titanium Power.</span>
               </h1>
               <p className="text-gray-400 text-lg leading-relaxed font-medium">Experience the next era of performance with the A17 Pro chip and a strong, lightweight titanium design.</p>
               <button className="group flex items-center gap-3 px-10 py-4 bg-[#2B59FF] hover:bg-blue-600 text-white font-bold rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/25">
                 Explore Now
                 <CaretRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
             <img 
               src={HERO_IMAGE_MAIN} 
               className="absolute right-[-10%] bottom-0 h-[95%] object-contain mix-blend-screen transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-2" 
               alt="iPhone 15 Pro"
             />
          </div>

          {/* Right Column Stack */}
          <div className="flex flex-col gap-8">
             <div className="flex-1 relative rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-[#000] overflow-hidden group shadow-xl">
               <div className="p-10 space-y-4 relative z-10">
                 <div className="inline-block p-1 px-3 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <span className="text-orange-500 text-[10px] font-black uppercase tracking-wider">Editor's Choice</span>
                 </div>
                 <h2 className="text-3xl font-black text-white tracking-tight">Watch Ultra 2.</h2>
                 <p className="text-gray-400 font-bold">The most capable watch.</p>
                 <button className="text-sm font-black text-[#2B59FF] flex items-center gap-2 group-hover:gap-3 transition-all pt-2">
                    Learn more <CaretRight weight="bold" />
                 </button>
               </div>
               <img 
                 src={HERO_IMAGE_WATCH} 
                 className="absolute right-[-15%] bottom-[-5%] w-[80%] object-contain transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3" 
                 alt="Watch Ultra 2"
               />
             </div>
             <div className="h-44 relative rounded-[3rem] bg-[#E2E8F0] overflow-hidden group shadow-xl flex items-center p-10 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="space-y-2 relative z-10">
                  <h2 className="text-2xl font-black text-[#111827] tracking-tight">Accessories</h2>
                  <p className="text-[#111827]/60 font-bold text-sm">Elevate your set-up.</p>
                </div>
                <div className="absolute right-10 w-24 h-24 rounded-full bg-white/50 flex items-center justify-center transition-transform group-hover:scale-110">
                   <Package size={40} weight="thin" className="text-gray-400" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Categories Modern Grid Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Shop by Category</h3>
             <div className="flex-1 h-[1px] bg-gray-100" />
          </div>
          
          {/* Responsive Layout: Balanced spacing using Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-4 justify-items-center">
            {/* All Category */}
            <button 
              onClick={() => setActiveCategory(null)}
              className={`flex flex-col items-center gap-3 transition-all group w-full ${activeCategory === null ? 'scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
            >
               <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] flex items-center justify-center transition-all duration-300 ${activeCategory === null ? 'bg-[#2B59FF] shadow-2xl shadow-blue-500/40 text-white' : 'bg-white shadow-sm border border-gray-100 text-gray-400 group-hover:shadow-lg'}`}>
                  <Star size={28} weight={activeCategory === null ? "fill" : "light"} />
               </div>
               <span className={`text-[10px] font-black uppercase tracking-widest text-[#111827] text-center ${activeCategory === null ? 'text-[#2B59FF]' : ''}`}>All</span>
            </button>

            {/* Dynamic Categories */}
            {categories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center gap-3 transition-all group w-full ${isActive ? 'scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                >
                   <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[#2B59FF] shadow-2xl shadow-blue-500/40 text-white' : 'bg-white shadow-sm border border-gray-100 text-gray-400 group-hover:shadow-lg'}`}>
                      {getCategoryIcon(cat.name, isActive)}
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-widest text-[#111827] text-center ${isActive ? 'text-[#2B59FF]' : ''}`}>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Grid with Dynamic Animation */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-1">
             <div className="w-12 h-1 bg-[#2B59FF] rounded-full" />
             <h2 className="text-4xl font-black text-[#111827] tracking-tighter">
                {activeCategory ? categories.find(c => c.id === activeCategory)?.name : 'Featured Gadgets'}
             </h2>
          </div>
          <Link to="/shop" className="group flex items-center gap-2 text-xs font-black text-[#2B59FF] hover:-translate-x-1 transition-all uppercase tracking-widest">
            View All <CaretRight weight="bold" />
          </Link>
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse space-y-6">
                <div className="aspect-square bg-gray-100 rounded-[3rem]" />
                <div className="h-5 bg-gray-100 rounded-full w-3/4 mx-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-16">
            {products.slice(0, 8).map((product, idx) => (
              <Link 
                to={`/product/${product.id}`}
                key={product.id} 
                className={`group block animate-fade-in-up stagger-${(idx % 8) + 1}`}
              >
                <div className="aspect-[4/5] bg-white rounded-[3.5rem] mb-6 overflow-hidden relative flex items-center justify-center p-12 transition-all duration-700 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] group-hover:-translate-y-4 shadow-sm border border-gray-50">
                  {product.image_urls?.[0] ? (
                    <img src={getFullUrl(product.image_urls[0])} alt={product.name} className="max-h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl" />
                  ) : (
                    <Package size={64} weight="thin" className="text-gray-200" />
                  )}
                  
                  {/* Premium Action Overlay */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product);
                    }}
                    className="absolute bottom-8 right-8 w-14 h-14 bg-[#111827] text-white rounded-2xl flex items-center justify-center shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-[#2B59FF] hover:scale-110 active:scale-95"
                  >
                    <ShoppingCart size={24} weight="bold" />
                  </button>

                  <div className="absolute top-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-wider text-gray-500">Quick View</span>
                  </div>
                </div>

                <div className="px-4 space-y-3">
                  <h3 className="text-lg font-black text-[#111827] group-hover:text-[#2B59FF] transition-colors line-clamp-1 leading-none tracking-tight">{product.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-[#111827]">
                      Rp {product.special_price?.toLocaleString('id-ID') || product.base_price?.toLocaleString('id-ID')}
                    </span>
                    {product.special_price && (
                      <span className="text-xs text-gray-400 line-through font-bold">Rp {product.base_price?.toLocaleString('id-ID')}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Blog Section */}
      <section className="bg-gray-50/50 py-20 border-t border-gray-100">
         <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div className="space-y-1">
                 <div className="w-12 h-1 bg-[#2B59FF] rounded-full" />
                 <h2 className="text-4xl font-black text-[#111827] tracking-tighter">Latest Stories.</h2>
              </div>
            </div>

            {isLoadingBlogs ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-6">
                    <div className="aspect-[16/10] bg-gray-200 rounded-[2rem]" />
                    <div className="h-4 bg-gray-200 rounded-full w-full" />
                    <div className="h-4 bg-gray-200 rounded-full w-2/3" />
                  </div>
                ))}
              </div>
            ) : blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {blogs.map((blog, idx) => (
                  <Link 
                    key={blog.id} 
                    to={`/blogs/${blog.id}`}
                    className={`group block bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 animate-fade-in-up stagger-${(idx % 3) + 1}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                       {blog.image_url ? (
                         <img src={getFullUrl(blog.image_url)} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <BookOpen size={48} weight="thin" />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                    </div>
                    <div className="p-8 space-y-4">
                       <span className="text-[10px] uppercase font-black tracking-widest text-[#2B59FF]">
                          {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                       </span>
                       <h3 className="text-xl font-black text-[#111827] leading-tight group-hover:text-[#2B59FF] transition-colors">{blog.title}</h3>
                       <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed">{blog.excerpt || blog.content}</p>
                       <div className="pt-2 text-sm font-black text-[#111827] flex items-center gap-2 group-hover:gap-3 group-hover:text-[#2B59FF] transition-all">
                         Read Article <ArrowRight weight="bold" />
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
                <div className="text-center py-10 text-gray-400 font-medium">No articles available yet.</div>
            )}
         </div>
      </section>

      {/* Premium Stats Strip */}
      <section className="bg-white py-20 border-y border-gray-100">
         <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { l: 'Express Shipping', d: 'Secure delivery to your door' },
              { l: 'Verified Quality', d: '100% Genuine electronics' },
              { l: 'Premium Support', d: '24/7 dedicated assistance' },
              { l: 'Safe Payment', d: 'Encryption across all transactions' }
            ].map((s, i) => (
              <div key={i} className="space-y-2">
                 <h4 className="text-sm font-black text-[#111827] uppercase tracking-wider">{s.l}</h4>
                 <p className="text-gray-400 text-sm font-medium">{s.d}</p>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default Home;
