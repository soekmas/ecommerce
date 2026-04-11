import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Storefront, UserCircle, Bell, MagnifyingGlass, List, CaretDown, Heart, Lightning, X, House, Phone, Buildings } from 'phosphor-react';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import api, { getFullUrl } from '../utils/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { settings } = useSettings();
  const { cartCount } = useCart();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/catalog/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  // ── SEARCH SUGGESTIONS LOGIC ──
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    setIsSearching(true);
    try {
      const res = await api.get(`/catalog/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
      setSuggestions(res.data.data || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/user/notifications');
      const data = res.data.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-[110] w-full bg-white shadow-sm transition-all duration-300">
      {/* Tier 1: Main Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex justify-between items-center gap-4 md:gap-8">
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
            >
              <List size={24} weight="bold" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="flex items-center gap-3">
                {settings.logo ? (
                  <div className="h-8 md:h-9 transition-transform group-hover:scale-110">
                    <img src={getFullUrl(settings.logo)} alt={settings.company_name} className="h-full w-auto object-contain" />
                  </div>
                ) : (
                  <div className="text-[#2B59FF] transition-transform group-hover:scale-105">
                    <Storefront size={28} weight="fill" />
                  </div>
                )}
                <span className="text-xl md:text-2xl font-black text-[#111827] tracking-tighter truncate max-w-[150px] md:max-w-none group-hover:text-[#2B59FF] transition-colors">
                  {settings.company_name}
                </span>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-2xl hidden md:block relative">
              <form onSubmit={handleSearch} className="flex items-center bg-[#F3F4F6] rounded-xl hover:bg-gray-200 transition-colors px-5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2B59FF]/20 relative z-[130]">
                <input 
                  type="text" 
                  placeholder="I am shopping for..." 
                  className="flex-1 bg-transparent py-2.5 text-sm outline-none text-[#111827] placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                />
                <button type="submit" className="flex items-center gap-2">
                  {isSearching && <div className="w-4 h-4 border-2 border-[#2B59FF] border-t-transparent rounded-full animate-spin" />}
                  <MagnifyingGlass size={20} weight="bold" className="text-gray-400 hover:text-[#2B59FF] transition-colors" />
                </button>
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <>
                  <div className="fixed inset-0 z-[120]" onClick={() => setShowSuggestions(false)} />
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[130]">
                    <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Products Found</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {suggestions.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug}`}
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-none group"
                        >
                          <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                             {product.image_urls?.[0] ? (
                               <img 
                                 src={getFullUrl(product.image_urls[0])} 
                                 alt={product.name} 
                                 className="max-w-full max-h-full object-contain"
                               />
                             ) : (
                               <Storefront size={20} className="text-gray-200" />
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-[#111827] truncate group-hover:text-[#2B59FF]">{product.name}</h4>
                            <p className="text-xs font-black text-[#2B59FF]">Rp {product.special_price?.toLocaleString() || product.base_price?.toLocaleString()}</p>
                          </div>
                          <CaretDown size={16} className="text-gray-300 -rotate-90" />
                        </Link>
                      ))}
                    </div>
                    <button 
                      onClick={handleSearch}
                      className="w-full py-3 text-xs font-bold text-center text-gray-500 hover:bg-gray-50 border-t border-gray-50 transition-colors"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-6 shrink-0">
              {/* Notifications - Desktop Only */}
              {user && (
                <div className="hidden sm:block relative">
                   <button className="flex flex-col items-center gap-0.5 text-[#111827] hover:text-[#2B59FF] transition-colors relative">
                      <Bell size={24} weight="regular" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 right-1 bg-red-500 text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white">
                          {unreadCount}
                        </span>
                      )}
                      <span className="hidden lg:block text-[10px] font-bold uppercase tracking-wider">Alerts</span>
                    </button>
                </div>
              )}

              {/* User Account */}
              <div className="relative group">
                <Link to={user ? "/profile" : "/login"} className="flex flex-col items-center gap-0.5 text-[#111827] hover:text-[#2B59FF] transition-colors">
                  <UserCircle size={24} weight="regular" />
                  <span className="hidden lg:block text-[10px] font-bold uppercase tracking-wider">{user ? 'Account' : 'Sign In'}</span>
                </Link>
                {/* Desktop Dropdown */}
                {user && (
                  <div className="absolute right-0 w-56 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-[120] hidden lg:block">
                    <div className="p-4 border-b border-gray-50">
                      <p className="text-sm font-bold text-[#111827] truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                       {user.role === 'admin' && (
                          <Link to="/admin" className="block px-4 py-2 text-sm text-[#111827] hover:bg-gray-50 rounded-lg">Admin Dashboard</Link>
                        )}
                        <Link to="/profile" className="block px-4 py-2 text-sm text-[#111827] hover:bg-gray-50 rounded-lg">My Profile</Link>
                        <Link to="/orders" className="block px-4 py-2 text-sm text-[#111827] hover:bg-gray-50 rounded-lg">My Orders</Link>
                        <hr className="my-1 border-gray-50" />
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium">Sign out</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link to="/cart" className="flex flex-col items-center gap-0.5 text-[#111827] hover:text-[#2B59FF] transition-colors relative">
                <ShoppingCart size={24} weight="regular" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 md:-right-2 bg-red-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white">
                    {cartCount}
                  </span>
                )}
                <span className="hidden lg:block text-[10px] font-bold uppercase tracking-wider">My Cart</span>
              </Link>
            </div>
          </div>

          {/* Search Bar - Mobile Only */}
          <div className="mt-3 md:hidden">
            <form onSubmit={handleSearch} className="flex items-center bg-[#F3F4F6] rounded-lg px-4 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2B59FF]/20">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="flex-1 bg-transparent text-sm outline-none text-[#111827]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">
                <MagnifyingGlass size={18} weight="bold" className="text-gray-400" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tier 2: Search Links & Categories Bar - Desktop Only */}
      <div className="border-b border-gray-50 bg-white hidden lg:block">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
              <Link to="/" className="text-sm font-semibold text-[#111827] hover:text-[#2B59FF] transition-colors whitespace-nowrap">Home</Link>
              <Link to="/shop" className="text-sm font-semibold text-[#111827] hover:text-[#2B59FF] transition-colors whitespace-nowrap">Shop</Link>
              <Link to="/flash-sales" className="text-sm font-black text-red-500 hover:text-red-700 transition-colors whitespace-nowrap flex items-center gap-1">
                <Lightning size={16} weight="fill" /> Flash Sales
              </Link>
              <Link to="/contact" className="text-sm font-semibold text-[#111827] hover:text-[#2B59FF] transition-colors whitespace-nowrap">Contact</Link>
              <Link to="/blogs" className="text-sm font-semibold text-[#111827] hover:text-[#2B59FF] transition-colors whitespace-nowrap">Blogs</Link>
            </div>

            <div className="flex items-center gap-2">
               <Link to="/shop?sort=sales" className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-200 hover:border-[#2B59FF]/30 transition-all group">
                 <span className="text-xs font-bold text-[#111827]">Best Sellers</span>
                 <span className="bg-red-500 text-[9px] font-black text-white px-1.5 py-0.5 rounded uppercase tracking-tighter animate-pulse">Sale</span>
               </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE MENU DRAWER ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xl font-black text-[#2B59FF] tracking-tighter">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={24} weight="bold" className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              {/* Quick Links */}
              <div className="space-y-4">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-gray-700 font-bold hover:text-[#2B59FF]">
                  <House size={20} weight="fill" className="text-[#2B59FF]" /> Home
                </Link>
                <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-gray-700 font-bold hover:text-[#2B59FF]">
                  <Storefront size={20} weight="fill" className="text-[#2B59FF]" /> Shop
                </Link>
                <Link to="/flash-sales" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-red-500 font-bold hover:text-red-600">
                  <Lightning size={20} weight="fill" /> Flash Sales
                </Link>
                <Link to="/blogs" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-gray-700 font-bold hover:text-[#2B59FF]">
                  <Buildings size={20} weight="fill" className="text-[#2B59FF]" /> Blog
                </Link>
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-gray-700 font-bold hover:text-[#2B59FF]">
                  <Phone size={20} weight="fill" className="text-[#2B59FF]" /> Contact
                </Link>
              </div>

              {/* Categories Section */}
              <div className="space-y-4 pt-6 border-t border-gray-50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Categories</h3>
                <div className="grid grid-cols-1 gap-1">
                  {categories.map(cat => (
                    <Link 
                      key={cat.id} 
                      to={`/shop?category_id=${cat.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2.5 px-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-[#2B59FF] rounded-lg transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-[#2B59FF] to-blue-400 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link 
                      to="/profile" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-center py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg"
                    >
                      Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full py-3.5 bg-[#2B59FF] text-white text-center font-bold rounded-xl shadow-lg shadow-blue-500/30"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
