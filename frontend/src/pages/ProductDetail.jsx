import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getFullUrl } from '../utils/api';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, Clock, Check, ListChecks, Package } from 'phosphor-react';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/catalog/products/${id}`);
        setProduct(res.data.data);
        setRelated(res.data.related || []);
        setActiveImage(0);
      } catch (err) {
        console.error("Error fetching product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
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
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">Fetching details...</p>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">Product not found.</h2>
      <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block font-bold">Return to shop</Link>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 animate-fade-in pb-20">
      <div className="py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors group">
          <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[13px] font-medium tracking-tight">All Products</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left: Product Images - Apple Style */}
        <div className="space-y-6">
          <div className="aspect-[4/5] bg-[#fbfbfd] rounded-[2rem] overflow-hidden flex items-center justify-center p-12 group transition-transform duration-700 hover:scale-[1.01]">
             {product.image_urls?.length > 0 ? (
               <img 
                src={getFullUrl(product.image_urls[activeImage])} 
                alt={product.name} 
                className="w-full h-full object-contain mix-blend-multiply" 
               />
             ) : (
               <Package size={120} weight="thin" className="text-gray-200" />
             )}
          </div>
          
          {product.image_urls?.length > 1 && (
            <div className="flex justify-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {product.image_urls.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-2xl transition-all overflow-hidden bg-[#f5f5f7] border-2 ${activeImage === idx ? 'border-[#0071e3]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                   <img src={getFullUrl(url)} alt="" className="w-full h-full object-contain p-2 mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info - Clean Apple Style */}
        <div className="space-y-12">
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-[#bf4800] uppercase tracking-widest">
                {product.category?.name || 'Essential'}
              </span>
              <h1 className="text-5xl font-semibold text-[#1d1d1f] leading-tight tracking-tight">{product.name}</h1>
              
              <div className="pt-2 flex items-center gap-4">
                {(() => {
                  const now = new Date();
                  const isSale = product.special_price &&
                    now >= new Date(product.special_price_start) &&
                    now <= new Date(product.special_price_end);
                  return isSale ? (
                    <div className="flex items-end gap-3">
                      <p className="text-2xl font-medium text-[#1d1d1f]">{formatPrice(product.special_price)}</p>
                      <span className="text-lg text-[#86868b] line-through mb-0.5">{formatPrice(product.base_price)}</span>
                      <span className="text-sm font-semibold text-[#e3000f] mb-1">
                        Save {Math.round((1 - product.special_price / product.base_price) * 100)}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-2xl font-medium text-[#1d1d1f]">{formatPrice(product.base_price)}</p>
                  );
                })()}
              </div>
            </div>

            <p className="text-[#1d1d1f]/80 text-lg leading-relaxed font-normal">{product.description}</p>
          </div>

          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#1d1d1f] uppercase tracking-tight">Quantity</span>
              <div className="flex items-center bg-[#f5f5f7] rounded-full p-1 h-10">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-full flex items-center justify-center text-[#1d1d1f] hover:bg-white hover:shadow-sm rounded-full transition-all"
                > - </button>
                <span className="w-10 text-center font-semibold text-[15px] text-[#1d1d1f]">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-full flex items-center justify-center text-[#1d1d1f] hover:bg-white hover:shadow-sm rounded-full transition-all"
                > + </button>
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={added}
              className={`w-full py-4 rounded-2xl text-[17px] font-medium transition-all duration-300 ${added ? 'bg-[#32d74b] text-white cursor-default' : 'bg-[#0071e3] text-white hover:bg-[#0077ed] active:scale-[0.98]'}`}
            >
              {added ? (
                <div className="flex items-center justify-center gap-2">
                  <Check size={20} weight="bold" />
                  <span>Added to Bag</span>
                </div>
              ) : (
                <span>Add to Bag</span>
              )}
            </button>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="flex items-start gap-3 p-4 bg-[#fbfbfd] rounded-2xl">
                <Truck size={24} className="text-[#0071e3] mt-0.5" />
                <div>
                   <p className="text-[14px] font-semibold text-[#1d1d1f]">Free delivery</p>
                   <p className="text-[13px] text-[#86868b]">Fast & secure transit nationwide.</p>
                </div>
             </div>
             <div className="flex items-start gap-3 p-4 bg-[#fbfbfd] rounded-2xl">
                <ShieldCheck size={24} className="text-[#0071e3] mt-0.5" />
                <div>
                   <p className="text-[14px] font-semibold text-[#1d1d1f]">Secure payment</p>
                   <p className="text-[13px] text-[#86868b]">Encryption for your safety.</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Specifications - Minimalist Style */}
      <div className="pt-24 space-y-12">
        <h2 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight">Tech Specs.</h2>
        
        {product.specifications && Object.keys(product.specifications).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex flex-col py-6 border-b border-gray-100">
                <span className="text-[13px] font-semibold text-[#86868b] uppercase tracking-widest mb-2">{key}</span>
                <span className="text-[17px] font-medium text-[#1d1d1f]">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#86868b] italic">Technical specifications are coming soon for this product.</p>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-10 pt-16 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">You May Also Like</h2>
            <Link to="/" className="text-sm font-bold text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-4">Explore More</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {related.map(item => (
              <Link 
                to={`/product/${item.id}`} 
                key={item.id} 
                className="group bg-white rounded-[2rem] p-4 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-500"
              >
                <div className="aspect-[4/5] bg-gray-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center relative">
                   {item.image_urls?.[0] ? (
                     <img src={getFullUrl(item.image_urls[0])} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                   ) : <Package size={48} className="text-gray-200" />}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                <p className="text-blue-600 font-black mt-1">{formatPrice(item.base_price)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Feature = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-3 text-center p-6 bg-white rounded-3xl border border-gray-50 shadow-sm hover:shadow-md transition-shadow group">
    <div className="group-hover:scale-110 transition-transform duration-500">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-blue-600 transition-colors">{label}</span>
  </div>
);

export default ProductDetail;
