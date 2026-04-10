import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getFullUrl } from '../utils/api';
import { useCart } from '../context/CartContext';
import { 
  SquaresFour, List, 
  CaretDown, ShoppingCart, 
  Star, MagnifyingGlass,
  ArrowRight, House
} from 'phosphor-react';

const Shop = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category_id');
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory || null);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState(10000000); // 10jt default max
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [activeCategory, sortBy, priceRange, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/catalog/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Build path carefully
      let params = new URLSearchParams();
      params.append('limit', '40');
      
      if (activeCategory && activeCategory !== 'null') {
        params.append('category_id', activeCategory);
      }

      if (priceRange) {
        params.append('max_price', priceRange.toString());
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      // Map friendly sort values to DB columns
      if (sortBy === 'newest') {
        params.append('sort', 'created_at');
        params.append('order', 'desc');
      } else if (sortBy === 'price_low') {
        params.append('sort', 'base_price');
        params.append('order', 'asc');
      } else if (sortBy === 'price_high') {
        params.append('sort', 'base_price');
        params.append('order', 'desc');
      } else if (sortBy === 'popular') {
        params.append('sort', 'id'); // Placeholder for popular
        params.append('order', 'desc');
      }
      
      const res = await api.get(`/catalog/products?${params.toString()}`);
      // Usually results are in res.data.data
      setProducts(res.data.data || res.data || []);
    } catch (err) {
      console.error("Fetch products failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <div className="animate-fade-in bg-white min-h-screen pb-20">
      <div className="bg-white border-b border-gray-100 py-10 mb-10 overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#2B59FF] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 animate-pulse">
                <ShoppingCart size={32} weight="fill" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#111827] tracking-tighter">Shop Catalog</h1>
                <p className="text-[#2B59FF] text-[10px] font-black uppercase tracking-[0.2em]">Discover Premium Tech</p>
              </div>
           </div>
           <div className="flex items-center gap-2 text-sm font-medium">
              <Link to="/" className="text-gray-400 hover:text-[#2B59FF] transition-colors flex items-center gap-1">
                <House size={16} /> Home
              </Link>
              <span className="text-gray-200">/</span>
              <span className="text-gray-900 font-bold">Product Shop</span>
           </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          
          {/* ── LEFT SIDEBAR: CATEGORIES ── */}
          <aside className="space-y-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-black text-[#111827] mb-8 pb-4 border-b border-gray-50">Product Category</h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setActiveCategory(null)}
                  className={`flex justify-between items-center w-full text-left font-bold transition-all ${!activeCategory ? 'text-[#2B59FF]' : 'text-gray-500 hover:text-[#111827]'}`}
                >
                  <span>All Products</span>
                  <span className="text-xs opacity-50">({products.length})</span>
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex justify-between items-center w-full text-left font-bold transition-all ${String(activeCategory) === String(cat.id) ? 'text-[#2B59FF]' : 'text-gray-500 hover:text-[#111827]'}`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Widget */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-black text-[#111827] mb-4">Search Here</h3>
              <form onSubmit={handleSearch} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Searching..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:border-[#2B59FF] focus:bg-white outline-none transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 w-9 h-9 bg-[#2B59FF] text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center shadow-lg shadow-blue-500/20"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                </button>
              </form>
            </div>

            {/* Price Filter */}
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
               <h2 className="text-xl font-black text-[#111827] mb-6">Price Range</h2>
               <div className="space-y-4">
                  <input 
                    type="range" 
                    min="0"
                    max="50000000"
                    step="100000"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full accent-[#2B59FF] cursor-pointer" 
                  />
                  <div className="flex justify-between text-xs font-bold text-gray-400">
                     <span>Rp 0</span>
                     <span className="text-[#2B59FF]">Max: Rp {priceRange.toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT: PRODUCT GRID ── */}
          <main>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 pb-6 border-b border-gray-50">
               <p className="text-sm font-bold text-gray-400">
                  Showing 1-{products.length} of {products.length} result
               </p>
               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-100">
                     <button className="p-2 text-gray-400 hover:text-[#111827] transition-colors"><List size={20} weight="bold" /></button>
                     <button className="p-2 bg-white text-orange-500 shadow-sm rounded-lg border border-gray-100"><SquaresFour size={20} weight="fill" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-gray-400">Sort by:</span>
                     <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-[#111827] outline-none focus:border-[#2B59FF] transition-all"
                     >
                        <option value="newest">Newest</option>
                        <option value="popular">Popular</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse bg-gray-50 rounded-2xl h-[400px]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                 <SquaresFour size={64} className="mx-auto text-gray-200 mb-4" />
                 <p className="text-gray-400 font-bold">No products found for this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div 
                    key={product.id}
                    className="group bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-500 flex flex-col"
                  >
                    {/* Image Container */}
                    <Link to={`/product/${product.slug}`} className="relative bg-[#F3F4F6] rounded-lg aspect-square overflow-hidden mb-6 flex items-center justify-center p-8">
                       {product.image_urls && product.image_urls.length > 0 ? (
                         <img 
                            src={getFullUrl(product.image_urls[0])} 
                            alt={product.name} 
                            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                         />
                       ) : (
                         <div className="text-gray-300">No Image</div>
                       )}
                       {/* Discount Badge */}
                       {product.special_price && (
                         <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-lg shadow-lg">
                            Sale
                         </span>
                       )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 px-2 space-y-3">
                       <Link to={`/product/${product.slug}`} className="block">
                          <h3 className="font-black text-[#111827] group-hover:text-[#2B59FF] transition-colors line-clamp-2 leading-tight">
                             {product.name}
                          </h3>
                       </Link>
                       
                       {/* Rating */}
                       <div className="flex items-center gap-1.5">
                          <div className="flex text-yellow-400">
                             <Star size={14} weight="fill" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-400">4.8 (1.2k)</span>
                       </div>

                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Stock: {product.stock}
                       </div>

                       {/* Price Block */}
                       <div className="flex items-center gap-2 pt-2">
                          {product.special_price ? (
                            <>
                              <span className="text-gray-300 line-through text-sm font-bold">
                                Rp {product.base_price.toLocaleString()}
                              </span>
                              <span className="text-xl font-black text-[#111827] tracking-tighter">
                                Rp {product.special_price.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-xl font-black text-[#111827] tracking-tighter">
                              Rp {product.base_price.toLocaleString()}
                            </span>
                          )}
                       </div>
                    </div>

                    {/* Add to Cart Footer */}
                    <div className="pt-6 px-2">
                       <button 
                          onClick={() => addToCart(product)}
                          className="w-full bg-gray-50 group-hover:bg-[#2B59FF] text-[#111827] group-hover:text-white py-3.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                       >
                          Add To Cart <ShoppingCart size={18} weight="bold" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;
