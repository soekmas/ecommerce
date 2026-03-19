import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api, { getFullUrl } from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft, CreditCard, CheckCircle, Tag, X, CircleNotch, MapPin, MagnifyingGlass, CaretRight, NavigationArrow, Package } from 'phosphor-react';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    courier_name: '',
    courier_service: '',
    shipping_cost: 0,
    payment_method: 'bank_transfer'
  });

  // Profile data
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tempAddress, setTempAddress] = useState({
    province: '',
    city: '',
    district: '',
    postal_code: '',
    full_address: '',
    phone: '',
    latitude: -6.2088,
    longitude: 106.8456
  });

  // Map Refs
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const searchTimeout = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { voucher, discount, finalTotal }
  const [voucherError, setVoucherError] = useState('');

  // Shipping Rates state
  const [shippingRates, setShippingRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      if (res.data && res.data.data) {
        const p = res.data.data;
        setProfile(p);
        
        // Auto-fill form if data exists
        if (p.full_address) {
          const fullAddr = `${p.full_address}, ${p.district}, ${p.city}, ${p.province}, ${p.postal_code}`;
          const initialAddr = {
            province: p.province || '',
            city: p.city || '',
            district: p.district || '',
            postal_code: p.postal_code || '',
            full_address: p.full_address || '',
            latitude: p.latitude || -6.2088,
            longitude: p.longitude || 106.8456,
            phone: p.phone || ''
          };
          
          setFormData(prev => ({ 
            ...prev, 
            address: fullAddr, 
            phone: p.phone || '',
            latitude: initialAddr.latitude,
            longitude: initialAddr.longitude,
            postal_code: initialAddr.postal_code
          }));
          
          setTempAddress(initialAddr);
          fetchShippingRates(initialAddr);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Map Initialization logic (reused from Profile.jsx)
  useEffect(() => {
    if (!showAddressModal || !mapRef.current || !window.L) return;

    const L = window.L;
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const initialLat = parseFloat(tempAddress.latitude) || -6.2088;
    const initialLng = parseFloat(tempAddress.longitude) || 106.8456;

    mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    markerInstance.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance.current);
    
    markerInstance.current.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      const fixedLat = lat.toFixed(6);
      const fixedLon = lng.toFixed(6);
      setTempAddress(prev => ({ ...prev, latitude: fixedLat, longitude: fixedLon }));
      handleReverseGeocode(fixedLat, fixedLon);
    });

    mapInstance.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      markerInstance.current.setLatLng([lat, lng]);
      const fixedLat = lat.toFixed(6);
      const fixedLon = lng.toFixed(6);
      setTempAddress(prev => ({ ...prev, latitude: fixedLat, longitude: fixedLon }));
      handleReverseGeocode(fixedLat, fixedLon);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [showAddressModal]);

  const handleReverseGeocode = async (lat, lon) => {
    try {
      const response = await api.get(`/auth/location/reverse?lat=${lat}&lon=${lon}`);
      const data = response.data;
      if (data && data.address) {
        const addr = data.address;
        setTempAddress(prev => ({
          ...prev,
          province: addr.state || addr.state_district || addr.province || addr.region || '',
          city: addr.city || addr.county || addr.municipality || '',
          district: addr.district || addr.city_district || addr.town || addr.suburb || addr.village || addr.neighbourhood || '',
          postal_code: addr.postcode || '',
          full_address: data.display_name || ''
        }));
      }
    } catch (err) {
      console.error("Reverse geocode failed", err);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const fixedLat = latitude.toFixed(6);
      const fixedLon = longitude.toFixed(6);
      setTempAddress(prev => ({ ...prev, latitude: fixedLat, longitude: fixedLon }));
      if (mapInstance.current && markerInstance.current) {
        mapInstance.current.setView([latitude, longitude], 15);
        markerInstance.current.setLatLng([latitude, longitude]);
      }
      handleReverseGeocode(fixedLat, fixedLon);
    });
  };

  const handleSearchLocation = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/auth/location/search?q=${encodeURIComponent(query)}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 800);
  };

  const selectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const fixedLat = lat.toFixed(6);
    const fixedLon = lon.toFixed(6);
    
    setTempAddress(prev => ({ 
        ...prev, 
        latitude: fixedLat, 
        longitude: fixedLon,
        province: result.address?.state || result.address?.state_district || result.address?.province || result.address?.region || '',
        city: result.address?.city || result.address?.county || result.address?.municipality || '',
        district: result.address?.district || result.address?.city_district || result.address?.town || result.address?.suburb || result.address?.village || result.address?.neighbourhood || '',
        postal_code: result.address?.postcode || '',
        full_address: result.display_name || ''
    }));
    
    setSearchQuery(result.display_name);
    setSearchResults([]);
    if (mapInstance.current && markerInstance.current) {
      mapInstance.current.setView([lat, lon], 16);
      markerInstance.current.setLatLng([lat, lon]);
    }
  };

  const applyNewAddress = () => {
    // Validate required fields
    if (!tempAddress.full_address || !tempAddress.city || !tempAddress.province) {
      alert("Please fill in the full address, city, and province.");
      return;
    }
    const fullAddrString = `${tempAddress.full_address}, ${tempAddress.district}, ${tempAddress.city}, ${tempAddress.province}, ${tempAddress.postal_code}`;
    setFormData(prev => ({ 
      ...prev, 
      address: fullAddrString, 
      phone: tempAddress.phone,
      latitude: tempAddress.latitude,
      longitude: tempAddress.longitude,
      postal_code: tempAddress.postal_code
    }));
    setShowAddressModal(false);
    fetchShippingRates(tempAddress);
  };

  const fetchShippingRates = async (addr) => {
    if (!addr.latitude || !addr.longitude) return;
    setLoadingRates(true);
    setRatesError('');
    try {
      const res = await api.post('/user/shipping/rates', {
        latitude: parseFloat(addr.latitude),
        longitude: parseFloat(addr.longitude),
        postal_code: addr.postal_code
      });
      setShippingRates(res.data.data || []);
      // Reset selected courier
      setFormData(prev => ({ ...prev, courier_name: '', courier_service: '', shipping_cost: 0 }));
    } catch (err) {
      console.error("Failed to fetch rates", err);
      setRatesError('Failed to get shipping rates. Please try a different location.');
    } finally {
      setLoadingRates(false);
    }
  };

  const selectCourier = (rate) => {
    setFormData(prev => ({
      ...prev,
      courier_name: rate.courier_code,
      courier_service: rate.courier_service_code,
      shipping_cost: rate.price
    }));
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await api.post('/catalog/voucher/validate', {
        code: voucherCode.toUpperCase().trim(),
        cart_total: cartTotal,
        user_email: user?.email || '',
      });
      setAppliedVoucher({
        voucher: res.data.voucher,
        discount: res.data.discount,
        finalTotal: res.data.final_total,
      });
    } catch (err) {
      setVoucherError(err.response?.data?.message || 'Invalid voucher code');
      setAppliedVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  const finalTotal = (appliedVoucher ? appliedVoucher.finalTotal : cartTotal) + formData.shipping_cost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict validation
    if (!profile?.phone && !formData.phone) {
      alert("Please provide a phone number for shipping.");
      return;
    }
    if (!formData.address || !formData.postal_code) {
      alert("Please complete your shipping address details.");
      return;
    }
    if (!formData.courier_name) {
      alert("Please select a delivery service.");
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      const res = await api.post('/user/checkout', {
        shipping_address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        postal_code: formData.postal_code,
        courier_name: formData.courier_name,
        courier_service: formData.courier_service,
        items: orderItems,
        voucher_code: appliedVoucher?.voucher?.code || '',
      });

      // Clear cart first
      clearCart();

      // Check for payment URL from Xendit
      if (res.data.data?.payment_url) {
          window.location.href = res.data.data.payment_url;
          return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Checkout failed. Please ensure you are logged in and have filled all fields.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-32 text-center animate-fade-in">
        <div className="w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-8 text-[#32d74b]">
          <CheckCircle size={40} weight="fill" />
        </div>
        <h2 className="text-[40px] font-semibold text-[#1d1d1f] mb-4 tracking-tight">Your order is confirmed.</h2>
        <p className="text-[#86868b] text-lg mb-12 tracking-tight">We've sent a confirmation email to your account.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/orders">
            <button className="px-8 py-3 bg-[#0071e3] text-white text-[17px] font-medium rounded-full hover:bg-[#0077ed] transition-colors">
              Track Order
            </button>
          </Link>
          <Link to="/">
            <button className="px-8 py-3 text-[#0071e3] text-[17px] font-medium hover:underline">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 animate-fade-in pb-32">
      <div className="py-8">
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-[#86868b] hover:text-[#1d1d1f] transition-all group">
          <ArrowLeft size={14} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[13px] font-medium tracking-tight">Back to Bag</span>
        </Link>
      </div>

      <div className="py-4 mb-12 border-b border-gray-100">
        <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">Checkout.</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
        {/* Main Form Flow */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-16">
            {/* Step 1: Shipping - Redesigned */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[21px] font-semibold text-[#1d1d1f]">1. Shipping Information</span>
              </div>
              
              <div className="space-y-6">
                <div className="bg-[#fbfbfd] rounded-2xl p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[17px] font-semibold text-[#1d1d1f]">Shipping Address</span>
                    <button 
                      type="button" 
                      onClick={() => setShowAddressModal(true)}
                      className="text-[14px] font-medium text-[#0071e3] hover:underline"
                    >
                      {formData.address ? 'Edit' : 'Add'}
                    </button>
                  </div>
                  
                  {formData.address ? (
                    <div className="space-y-3">
                      <p className="text-[17px] text-[#1d1d1f] leading-relaxed">
                        {formData.address}
                      </p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[13px] font-semibold text-[#86868b] uppercase tracking-widest">Phone</span>
                        <span className="text-[15px] font-medium text-[#1d1d1f]">{formData.phone || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4">
                       <p className="text-[15px] text-[#bf4800] bg-[#fff1e7] p-4 rounded-xl border border-[#ffcfb9]">
                         Please provide a shipping address to see available delivery options.
                       </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Step 2: Courier Selection - Redesigned */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[21px] font-semibold text-[#1d1d1f]">2. Delivery Method</span>
              </div>
              
              {!formData.address ? (
                <div className="p-12 border border-dashed border-gray-200 rounded-2xl text-center bg-[#fbfbfd]">
                  <p className="text-[15px] text-[#86868b]">Select a shipping address to see delivery options.</p>
                </div>
              ) : loadingRates ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 bg-[#fbfbfd] rounded-2xl border border-gray-100">
                  <CircleNotch size={32} className="animate-spin text-[#0071e3]" />
                  <p className="text-[13px] font-medium text-[#86868b]">Finding the best rates...</p>
                </div>
              ) : ratesError ? (
                <div className="p-6 bg-[#fff1e7] text-[#bf4800] rounded-xl border border-[#ffcfb9] text-[15px] flex items-center gap-3">
                   <X size={18} weight="bold" /> {ratesError}
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingRates.map((rate, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectCourier(rate)}
                      className={`w-full p-6 rounded-2xl border transition-all flex justify-between items-center group ${
                        formData.courier_service === rate.courier_service_code 
                        ? 'border-[#0071e3] bg-white ring-1 ring-[#0071e3]' 
                        : 'border-[#d2d2d7] bg-white hover:border-[#86868b]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-[17px] font-semibold text-[#1d1d1f]">
                            {rate.courier_name} {rate.courier_service_name}
                          </p>
                          <p className="text-[13px] text-[#86868b] mt-0.5">Estimated delivery: {rate.duration}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="text-[17px] font-medium text-[#1d1d1f]">Rp {rate.price.toLocaleString('id-ID')}</p>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.courier_service === rate.courier_service_code ? 'border-[#0071e3] bg-[#0071e3]' : 'border-[#d2d2d7]'}`}>
                           {formData.courier_service === rate.courier_service_code && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Step 3: Voucher - Redesigned */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-[21px] font-semibold text-[#1d1d1f]">3. Voucher Code</span>
                <p className="text-[13px] text-[#86868b] font-medium tracking-tight">Optional</p>
              </div>
              
              {!appliedVoucher ? (
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      value={voucherCode}
                      onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyVoucher())}
                      placeholder="Enter promo code"
                      className="w-full px-6 py-4 bg-[#fbfbfd] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all font-medium text-[17px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyVoucher}
                    disabled={!voucherCode || voucherLoading}
                    className="px-8 py-4 bg-[#1d1d1f] hover:bg-black text-white text-[14px] font-medium rounded-2xl transition-all disabled:opacity-30 disabled:bg-gray-400"
                  >
                    {voucherLoading ? <CircleNotch size={18} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[#f2fcf5] border border-[#d3f4dd] rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#32d74b] rounded-full flex items-center justify-center flex-shrink-0">
                      <Tag size={20} className="text-white" weight="fill" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1d1d1f] text-[15px]">{appliedVoucher.voucher.code}</p>
                      <p className="text-[13px] text-[#1d1d1f]/60 font-medium">
                        {appliedVoucher.voucher.discount_type === 'percentage'
                          ? `${appliedVoucher.voucher.discount_value}% discount applied`
                          : `Rp ${appliedVoucher.discount.toLocaleString('id-ID')} discount applied`
                        }
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={removeVoucher} className="p-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                    <X size={20} />
                  </button>
                </div>
              )}
              {voucherError && (
                <p className="text-[#e3000f] text-[13px] font-medium pl-2">
                   {voucherError}
                </p>
              )}
            </section>

            {/* Step 4: Payment - Redesigned */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[21px] font-semibold text-[#1d1d1f]">4. Payment Method</span>
              </div>
              
              <div className="bg-[#f5f5f7] rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0071e3] rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard size={24} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <p className="text-[17px] font-semibold text-[#1d1d1f]">Fast, secure checkout.</p>
                    <p className="text-[15px] text-[#86868b]">Powered by Xendit. You'll be redirected to pay securely.</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                   {['Bank Transfer', 'Virtual Account', 'e-Wallet', 'QRIS'].map(method => (
                     <span key={method} className="px-4 py-1.5 bg-white border border-[#d2d2d7] rounded-full text-[13px] font-medium text-[#1d1d1f]">
                       {method}
                     </span>
                   ))}
                </div>
              </div>
            </section>

            {/* Removed redundant button to align with minimalist aesthetic */}
          </form>
        </div>

        {/* Order Review - Apple Style Sidebar */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="space-y-10">
            <h3 className="text-[24px] font-semibold text-[#1d1d1f]">Order Summary</h3>
            
            <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2 scrollbar-none">
                {cart.map(item => {
                    const price = item.effective_price ?? item.base_price;
                    const isSale = item.effective_price && item.effective_price !== item.base_price;
                    return (
                      <div key={item.id} className="flex justify-between items-start gap-4">
                          <div className="flex gap-4">
                              <div className="w-16 h-16 bg-[#f5f5f7] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.image_urls?.[0] ? (
                                  <img src={getFullUrl(item.image_urls[0])} alt="" className="w-full h-full object-contain mix-blend-multiply p-2" />
                                ) : <Package size={24} weight="thin" className="text-gray-300" />}
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[15px] font-semibold text-[#1d1d1f] leading-tight">{item.name}</p>
                                  <p className="text-[13px] text-[#86868b] font-medium">Qty: {item.quantity}</p>
                              </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[15px] font-medium text-[#1d1d1f]">Rp {(price * item.quantity).toLocaleString('id-ID')}</p>
                            {isSale && (
                              <p className="text-[11px] text-[#e3000f] font-semibold">Special Offer Applied</p>
                            )}
                          </div>
                      </div>
                    );
                })}
            </div>
            
            <div className="pt-8 border-t border-gray-100 space-y-4">
                <div className="flex justify-between text-[17px]">
                    <span className="text-[#86868b]">Subtotal</span>
                    <span className="text-[#1d1d1f]">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
                
                {cartTotal !== cart.reduce((t, i) => t + i.base_price * i.quantity, 0) && (
                   <div className="flex justify-between text-[15px] text-[#e3000f]">
                     <span className="font-medium">Product Savings</span>
                     <span className="font-semibold">-Rp {(cart.reduce((t, i) => t + i.base_price * i.quantity, 0) - cartTotal).toLocaleString('id-ID')}</span>
                   </div>
                )}
                
                {appliedVoucher && (
                  <div className="flex justify-between text-[15px] text-[#32d74b]">
                    <span className="font-medium">Voucher ({appliedVoucher.voucher.code})</span>
                    <span className="font-semibold">-Rp {appliedVoucher.discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-[17px]">
                    <span className="text-[#86868b]">Shipping</span>
                    <span className="text-[#1d1d1f]">
                      {formData.shipping_cost > 0 ? `Rp ${formData.shipping_cost.toLocaleString('id-ID')}` : 'Free'}
                    </span>
                </div>

                <div className="flex justify-between items-baseline pt-6 border-t border-gray-100">
                    <span className="text-[24px] font-semibold text-[#1d1d1f]">Total</span>
                    <span className="text-[24px] font-semibold text-[#1d1d1f]">Rp {finalTotal.toLocaleString('id-ID')}</span>
                </div>
            </div>

            <button 
                type="submit"
                onClick={handleSubmit} 
                className="w-full py-4 bg-[#0071e3] text-white text-[17px] font-medium rounded-2xl hover:bg-[#0077ed] active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400"
                disabled={loading || cart.length === 0 || !formData.address || !formData.courier_name || !formData.phone}
            >
              {!formData.address ? "Address Incomplete" : 
               !formData.phone ? "Phone Number Required" :
               !formData.courier_name ? "Select Delivery Service" : 
               (loading ? "Processing..." : `Place Order • Rp ${finalTotal.toLocaleString('id-ID')}`)}
            </button>
            
            <p className="text-[12px] text-[#86868b] text-center px-6 leading-relaxed">
              By completing your purchase, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Address Modal - Redesigned Apple Style */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1d1d1f]/30 backdrop-blur-xl" onClick={() => setShowAddressModal(false)} />
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-scale-in">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <div>
                <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">Delivery Address</h2>
                <p className="text-[15px] text-[#86868b] tracking-tight">Enter your shipping details below.</p>
              </div>
              <button onClick={() => setShowAddressModal(false)} className="p-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Form Side */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[12px] font-semibold text-[#1d1d1f] tracking-tight ml-1">Province</label>
                        <input 
                          className="w-full bg-[#f5f5f7] px-4 py-3 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#0071e3] text-[15px]"
                          value={tempAddress.province}
                          onChange={e => setTempAddress({...tempAddress, province: e.target.value})}
                          placeholder="e.g. Jawa Barat"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[12px] font-semibold text-[#1d1d1f] tracking-tight ml-1">City</label>
                        <input 
                          className="w-full bg-[#f5f5f7] px-4 py-3 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#0071e3] text-[15px]"
                          value={tempAddress.city}
                          onChange={e => setTempAddress({...tempAddress, city: e.target.value})}
                          placeholder="e.g. Bandung"
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[12px] font-semibold text-[#1d1d1f] tracking-tight ml-1">District</label>
                        <input 
                          className="w-full bg-[#f5f5f7] px-4 py-3 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#0071e3] text-[15px]"
                          value={tempAddress.district}
                          onChange={e => setTempAddress({...tempAddress, district: e.target.value})}
                          placeholder="e.g. Coblong"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[12px] font-semibold text-[#1d1d1f] tracking-tight ml-1">Postal Code</label>
                        <input 
                          className="w-full bg-[#f5f5f7] px-4 py-3 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#0071e3] text-[15px]"
                          value={tempAddress.postal_code}
                          onChange={e => setTempAddress({...tempAddress, postal_code: e.target.value})}
                          placeholder="40132"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-[#1d1d1f] tracking-tight ml-1">Street Address</label>
                    <textarea 
                      rows="3"
                      className="w-full bg-[#f5f5f7] px-4 py-3 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#0071e3] text-[15px] resize-none"
                      value={tempAddress.full_address}
                      onChange={e => setTempAddress({...tempAddress, full_address: e.target.value})}
                      placeholder="Street, suite, building, floor, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-[#1d1d1f] tracking-tight ml-1">Phone Number</label>
                    <input 
                      type="tel"
                      className="w-full bg-[#f5f5f7] px-4 py-3 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#0071e3] text-[15px]"
                      value={tempAddress.phone}
                      onChange={e => setTempAddress({...tempAddress, phone: e.target.value})}
                      placeholder="e.g. 08123456789"
                    />
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                     <label className="text-[10px] font-black uppercase text-[#86868b] tracking-widest ml-1 mb-2 block">Map Coordinates</label>
                     <div className="flex gap-4">
                        <div className="flex-1 bg-[#f5f5f7] p-3 rounded-xl text-center">
                           <p className="text-[10px] text-[#86868b] font-bold uppercase">Lat</p>
                           <p className="text-[13px] font-mono font-medium text-[#1d1d1f]">{tempAddress.latitude || '0'}</p>
                        </div>
                        <div className="flex-1 bg-[#f5f5f7] p-3 rounded-xl text-center">
                           <p className="text-[10px] text-[#86868b] font-bold uppercase">Long</p>
                           <p className="text-[13px] font-mono font-medium text-[#1d1d1f]">{tempAddress.longitude || '0'}</p>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Map Side */}
                <div className="space-y-6">
                  <div className="relative group">
                    <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] z-10" size={18} />
                    <input 
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-[#f5f5f7] rounded-xl outline-none focus:ring-1 focus:ring-[#0071e3] transition-all text-[15px]"
                      placeholder="Search for an address"
                      value={searchQuery}
                      onChange={handleSearchLocation}
                    />
                    {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CircleNotch className="animate-spin text-[#0071e3]" /></div>}
                    
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-2 max-h-60 overflow-y-auto">
                        {searchResults.map((res, i) => (
                          <button 
                            key={i}
                            onClick={() => selectLocation(res)}
                            className="w-full text-left px-4 py-3 hover:bg-[#f5f5f7] flex items-start gap-3 transition-colors group"
                          >
                            <MapPin size={18} className="text-[#86868b] group-hover:text-[#0071e3] mt-0.5" />
                            <span className="text-[13px] font-medium text-[#1d1d1f] leading-relaxed">{res.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative h-64 rounded-2xl overflow-hidden bg-[#f5f5f7]">
                    <div ref={mapRef} className="w-full h-full z-10" />
                    <button 
                      type="button"
                      onClick={handleGetLocation}
                      className="absolute bottom-4 right-4 z-20 bg-white p-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-[#0071e3]"
                    >
                      <NavigationArrow size={20} weight="fill" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 flex gap-4 bg-white sticky bottom-0 z-20">
              <button 
                className="flex-1 py-4 text-[#86868b] text-[15px] font-medium hover:text-[#1d1d1f] transition-all" 
                onClick={() => setShowAddressModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] py-4 bg-[#1d1d1f] text-white text-[15px] font-medium rounded-2xl hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-black/10" 
                onClick={applyNewAddress}
              >
                Save and Use Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
