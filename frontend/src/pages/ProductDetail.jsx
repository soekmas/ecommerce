import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getFullUrl } from '../utils/api';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { calculatePromoPrice } from '../utils/promoHelper';
import { 
  ArrowLeft, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  Check, 
  Package, 
  CaretRight, 
  Star,
  Minus,
  Plus
} from 'phosphor-react';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { user } = useContext(AuthContext);

  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const res = await api.get(`/catalog/products/slug/${slug}`);
        setProduct(res.data.data);
        // Fallback or real related
        setRelated(res.data.related || []);
        setActiveImage(0);
        setQuantity(1);
      } catch (err) {
        console.error("Error fetching product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-[6px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading Excellence...</p>
    </div>
  );

  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 text-center px-6">
       <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
          <Package size={48} className="text-red-200" weight="thin" />
       </div>
       <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Product Not Found</h2>
          <p className="text-gray-400 font-medium">It seems this piece of technology has moved on.</p>
       </div>
       <Link to="/shop" className="px-10 py-4 bg-[#111827] text-white font-bold rounded-full hover:bg-black transition-all">
          Browse All Products
       </Link>
    </div>
  );

  const { effectivePrice: displayPrice, isSale, discountPct } = calculatePromoPrice(product, user);

  return (
    <div className="animate-fade-in pb-32">
      {/* Sticky Top Bar (Mobile/Scrolled) */}
      <div className={`fixed top-0 inset-x-0 bg-white/80 backdrop-blur-xl z-40 border-b border-gray-100 transition-all duration-500 ${isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
         <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <span className="text-sm font-black text-[#111827] truncate max-w-[200px]">{product.name}</span>
               <span className="text-sm font-black text-[#2B59FF]">{formatPrice(displayPrice)}</span>
            </div>
            <button 
              onClick={handleAddToCart}
              className="px-6 py-2 bg-[#2B59FF] text-white text-xs font-black rounded-full shadow-lg shadow-blue-500/20"
            >
              Add to Bag
            </button>
         </div>
      </div>

      {/* Breadcrumbs & Navigation */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex items-center gap-4">
          <Link to="/shop" className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#2B59FF] hover:border-[#2B59FF] transition-all shadow-sm">
            <ArrowLeft size={16} weight="bold" />
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
             <Link to="/" className="hover:text-gray-900">Home</Link>
             <CaretRight size={10} />
             <Link to="/shop" className="hover:text-gray-900">Shop</Link>
             <CaretRight size={10} />
             <span className="text-gray-900 truncate max-w-[150px]">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        {/* Left: Premium Gallery */}
        <div className="space-y-8 sticky top-24">
          <div className="aspect-[4/5] bg-white rounded-[4rem] overflow-hidden flex items-center justify-center p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-gray-50 group">
             {product.image_urls?.length > 0 ? (
               <img 
                 src={getFullUrl(product.image_urls[activeImage])} 
                 alt={product.name} 
                 className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-110 drop-shadow-2xl" 
               />
             ) : (
               <Package size={120} weight="thin" className="text-gray-100" />
             )}
          </div>
          
          {product.image_urls?.length > 1 && (
            <div className="flex justify-center gap-4 overflow-x-auto no-scrollbar py-2">
              {product.image_urls.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-3xl transition-all overflow-hidden bg-white border ${activeImage === idx ? 'border-[#2B59FF] shadow-xl shadow-blue-500/10' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                >
                   <img src={getFullUrl(url)} alt="" className="w-full h-full object-contain p-4" />
                   {activeImage === idx && <div className="absolute inset-0 bg-[#2B59FF]/5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Refined Product Info */}
        <div className="space-y-16 py-8">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <span className="px-4 py-1 bg-blue-50 text-[#2B59FF] rounded-full text-[10px] font-black uppercase tracking-widest">
                    {product.category?.name || 'Curated Batch'}
                 </span>
                 <div className="flex items-center gap-1 text-orange-400">
                    <Star weight="fill" size={14} />
                    <span className="text-xs font-black text-gray-900">4.9</span>
                    <span className="text-[10px] font-bold text-gray-400">(128 Reviews)</span>
                 </div>
              </div>

              <h1 className="text-6xl font-black text-[#111827] leading-[1.05] tracking-tighter">{product.name}</h1>
              
              <div className="flex items-center gap-6">
                <p className="text-4xl font-black text-[#111827] tracking-tight">{formatPrice(displayPrice)}</p>
                {isSale && (
                  <div className="flex items-center gap-3">
                     <span className="text-xl text-gray-300 line-through font-bold">{formatPrice(product.base_price)}</span>
                     <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Save {discountPct}%
                     </span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-[1px] bg-gray-100 w-full" />

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Description</h4>
               <p className="text-[#111827]/70 text-lg leading-relaxed font-medium">{product.description}</p>
            </div>
          </div>

          {/* Action Area */}
          <div className="space-y-8 bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#111827]">Order Quantity</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-400' : product.stock > 0 ? 'bg-orange-400' : 'bg-red-400'}`}></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {product.stock > 0 ? `${product.stock} units in warehouse` : 'Sold out'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center bg-white shadow-sm border border-gray-100 rounded-full p-1.5 px-3 gap-4">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stock === 0}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#111827] hover:bg-gray-50 rounded-full transition-all disabled:opacity-20"
                > <Minus weight="bold" /> </button>
                <span className="w-6 text-center font-black text-lg text-[#111827]">{product.stock === 0 ? 0 : quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={product.stock === 0 || quantity >= product.stock}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#111827] hover:bg-gray-50 rounded-full transition-all disabled:opacity-20"
                > <Plus weight="bold" /> </button>
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={added || product.stock === 0}
              className={`w-full py-5 rounded-3xl text-lg font-black transition-all duration-500 shadow-2xl ${
                product.stock === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : added 
                    ? 'bg-[#32d74b] text-white shadow-green-500/20' 
                    : 'bg-[#2B59FF] text-white hover:bg-blue-600 active:scale-[0.98] shadow-blue-500/25'
              }`}
            >
              {product.stock === 0 ? 'Out of Stock' : added ? 'Item Added to Bag' : 'Add to Bag'}
            </button>
          </div>

          {/* Value Props Row */}
          <div className="flex flex-wrap gap-8">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2B59FF] flex items-center justify-center">
                   <Truck size={24} weight="bold" />
                </div>
                <div>
                   <p className="text-xs font-black text-[#111827] uppercase tracking-wider">Fast Shipping</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Across Indonesia</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center">
                   <ShieldCheck size={24} weight="bold" />
                </div>
                <div>
                   <p className="text-xs font-black text-[#111827] uppercase tracking-wider">Secure Warranty</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">1 Year Official</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Tech Specs Section */}
      <section className="max-w-[1400px] mx-auto px-6 pt-32 space-y-16">
        <div className="flex items-center gap-6">
           <h2 className="text-4xl font-black text-[#111827] tracking-tighter shrink-0">Technical<br />Specifications.</h2>
           <div className="flex-1 h-[1px] bg-gray-100" />
        </div>
        
        {product.specifications && Object.keys(product.specifications).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-12">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="space-y-2 group">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">{key}</span>
                <p className="text-xl font-bold text-[#111827] group-hover:text-blue-600 transition-colors">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 bg-gray-50 rounded-[4rem] text-center">
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Standard configuration model. No additional specs listed.</p>
          </div>
        )}
      </section>

      {/* Related Products Grid */}
      {related.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 pt-32 space-y-16">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
               <div className="w-12 h-1 bg-[#2B59FF] rounded-full" />
               <h2 className="text-4xl font-black text-[#111827] tracking-tighter">You May Also Like</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-16">
            {related.slice(0, 4).map((item, idx) => (
              <Link 
                to={`/product/${item.slug}`} 
                key={item.id} 
                className={`group block animate-fade-in-up stagger-${(idx % 4) + 1}`}
              >
                <div className="aspect-[4/5] bg-white rounded-[3rem] mb-6 overflow-hidden flex items-center justify-center p-10 transition-all duration-700 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] group-hover:-translate-y-4 shadow-sm border border-gray-50">
                    {item.image_urls?.[0] ? (
                      <img src={getFullUrl(item.image_urls[0])} alt="" className="max-h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                    ) : <Package size={64} weight="thin" className="text-gray-200" />}
                </div>
                <div className="px-4 space-y-2 text-center">
                   <h3 className="text-lg font-black text-[#111827] group-hover:text-[#2B59FF] transition-colors truncate">{item.name}</h3>
                   <p className="text-xl font-black text-[#111827]">{formatPrice(calculatePromoPrice(item, user).effectivePrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
