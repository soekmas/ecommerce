import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api, { getFullUrl } from '../utils/api';
import Button from '../components/Button';
import { calculateItemTotal, calculatePromoPrice } from '../utils/promoHelper';
import { ArrowLeft, CreditCard, CheckCircle, Tag, X, CircleNotch, MapPin, MagnifyingGlass, CaretRight, NavigationArrow, Package, ShieldCheck, Truck, ArrowRight } from 'phosphor-react';

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

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchPreview = async (overrideVoucher) => {
    if (cart.length === 0) return;
    setPreviewLoading(true);
    setVoucherError('');
    try {
      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));
      const currentVoucher = overrideVoucher !== undefined ? overrideVoucher : (appliedVoucher?.voucher?.code || '');
      const res = await api.post('/user/checkout/preview', {
        shipping_address: formData.address || 'dummy address',
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        postal_code: formData.postal_code || '00000',
        courier_name: formData.courier_name || 'dummy',
        courier_service: formData.courier_service || 'dummy',
        items: orderItems,
        voucher_code: currentVoucher
      });
      
      const data = res.data.data;
      setPreviewData(data);
      
      if (currentVoucher && !data.applied_voucher) {
        setVoucherError('Voucher is invalid or cannot be stacked.');
        setAppliedVoucher(null);
      } else if (data.applied_voucher) {
         setAppliedVoucher({
             voucher: data.applied_voucher,
             discount: data.voucher_discount,
             finalTotal: data.subtotal - data.promo_discount - data.voucher_discount
         });
      } else {
         setAppliedVoucher(null);
      }
    } catch (err) {
       console.error("Preview failed", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, formData.address, formData.courier_service]);

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
    await fetchPreview(voucherCode.toUpperCase().trim());
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
    fetchPreview('');
  };

  const currentSubtotal = previewData ? previewData.subtotal : cartTotal;
  const currentPromo = previewData ? previewData.promo_discount : 0;
  const currentVoucherDisc = previewData ? previewData.voucher_discount : (appliedVoucher?.discount || 0);
  const calculatedTotalAmount = currentSubtotal - currentPromo - currentVoucherDisc;
  const finalTotal = (calculatedTotalAmount > 0 ? calculatedTotalAmount : 0) + formData.shipping_cost;

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
    <div className="max-w-[1300px] mx-auto px-6 animate-fade-in pb-32">
      {/* Navigation & Header */}
      <div className="py-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/cart" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#2B59FF] hover:border-[#2B59FF] transition-all shadow-sm">
            <ArrowLeft size={16} weight="bold" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
             <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
             <CaretRight size={10} />
             <Link to="/shop" className="hover:text-gray-900 transition-colors">Shop</Link>
             <CaretRight size={10} />
             <Link to="/cart" className="hover:text-gray-900 transition-colors">Bag</Link>
             <CaretRight size={10} />
             <span className="text-gray-900">Checkout</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
           <ShieldCheck size={18} weight="bold" className="text-green-500" />
           <span className="text-[10px] font-black uppercase tracking-widest text-[#111827]">Secure Checkout</span>
        </div>
      </div>

      <div className="py-10 mb-12">
        <h1 className="text-5xl font-black text-[#111827] tracking-tighter">Review & Checkout.</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-7 space-y-12">
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Step 1: Shipping */}
            <section className="space-y-6 animate-fade-in-up stagger-1">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-[#111827] text-white flex items-center justify-center font-bold">1</div>
                 <h2 className="text-2xl font-black text-[#111827] tracking-tight">Shipping</h2>
              </div>
              
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <MapPin size={20} weight="bold" className="text-[#2B59FF]" />
                     <span className="text-xs font-black uppercase tracking-widest text-gray-400">Shipping Address</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowAddressModal(true)}
                    className="text-xs font-black uppercase tracking-widest text-[#2B59FF] hover:underline"
                  >
                    {formData.address ? 'Edit Address' : 'Add Address'}
                  </button>
                </div>
                
                {formData.address ? (
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <p className="text-lg font-bold text-[#111827] leading-relaxed">
                      {formData.address}
                    </p>
                    <div className="flex gap-6 mt-4 pt-4 border-t border-gray-200/50">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone</p>
                          <p className="text-sm font-bold text-[#111827]">{formData.phone || profile?.phone || '-'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Postal</p>
                          <p className="text-sm font-bold text-[#111827]">{formData.postal_code || '-'}</p>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                     <p className="text-gray-400 font-bold text-xs">No address selected yet.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Step 2: Delivery */}
            <section className="space-y-6 animate-fade-in-up stagger-2">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-[#111827] text-white flex items-center justify-center font-bold">2</div>
                 <h2 className="text-2xl font-black text-[#111827] tracking-tight">Delivery Method</h2>
              </div>
              
              {!formData.address ? (
                <div className="p-12 bg-white rounded-[2rem] border border-gray-100 text-center">
                  <p className="text-gray-400 font-black uppercase tracking-widest text-[9px]">Select address first</p>
                </div>
              ) : loadingRates ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 bg-white rounded-[2rem] border border-gray-100">
                  <CircleNotch size={32} className="animate-spin text-[#2B59FF]" />
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Calculating rates...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shippingRates.map((rate, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectCourier(rate)}
                      className={`p-6 rounded-[1.5rem] border transition-all text-left relative overflow-hidden ${
                        formData.courier_service === rate.courier_service_code && formData.courier_name === rate.courier_code
                        ? 'border-[#2B59FF] bg-blue-50/30' 
                        : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      {formData.courier_service === rate.courier_service_code && formData.courier_name === rate.courier_code && (
                        <div className="absolute top-4 right-4">
                           <CheckCircle size={20} weight="fill" className="text-[#2B59FF]" />
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Truck size={20} weight="bold" className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-[#111827]">{rate.courier_name}</p>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{rate.courier_service_name}</p>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                           <span className="text-[10px] font-bold text-gray-400">{rate.duration}</span>
                           <p className="text-md font-black text-[#111827]">Rp {rate.price.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Step 3: Payment Method */}
            <section className="space-y-6 animate-fade-in-up stagger-3">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-[#2B59FF] text-white flex items-center justify-center font-bold">3</div>
                 <h2 className="text-2xl font-black text-[#111827] tracking-tight">Payment Method</h2>
              </div>
              
              <div className="bg-white rounded-[2rem] p-8 space-y-6 border border-[#2B59FF]/10 shadow-lg shadow-blue-500/5">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                     <CreditCard size={28} weight="fill" className="text-[#2B59FF]" />
                   </div>
                   <div>
                     <p className="text-xl font-black text-[#111827]">Xendit Secure Gateway</p>
                     <p className="text-xs text-gray-500 font-medium tracking-tight">Pay with Bank Transfer, VA, or e-Wallet.</p>
                   </div>
                 </div>
                 <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                    {['QRIS', 'Bank Transfer', 'e-Wallet'].map(m => (
                      <span key={m} className="px-3 py-1 bg-blue-50/50 rounded-full text-[9px] font-black uppercase tracking-widest text-[#2B59FF] border border-[#2B59FF]/10">{m}</span>
                    ))}
                 </div>
              </div>
            </section>
          </form>
        </div>

        {/* Order Review Sidebar */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8 animate-fade-in-up stagger-2">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-100/50 space-y-8">
            <h3 className="text-2xl font-black text-[#111827] tracking-tight">Order Summary</h3>
            
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {cart.map(item => {
                    return (
                      <div key={item.id} className="flex justify-between items-center gap-4 group">
                          <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                                {item.image_urls?.[0] ? (
                                  <img src={getFullUrl(item.image_urls[0])} alt="" className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                                ) : <Package size={24} weight="thin" className="text-gray-300" />}
                              </div>
                              <div className="space-y-1">
                                  <p className="text-sm font-black text-[#111827] line-clamp-1">{item.name}</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                                  {(() => {
                                      const promo = calculatePromoPrice(item, user);
                                      const isSplit = promo.isSale && item.special_price_max_qty > 0 && item.quantity > item.special_price_max_qty;
                                      if (isSplit) {
                                          return (
                                              <p className="text-[8px] font-bold text-[#2B59FF] italic uppercase tracking-wider">
                                                  {item.special_price_max_qty} Promo + {item.quantity - item.special_price_max_qty} Regular
                                              </p>
                                          );
                                      }
                                      return null;
                                  })()}
                              </div>
                          </div>
                          <p className="text-sm font-black text-[#111827]">Rp {calculateItemTotal(item, item.quantity, user).toLocaleString('id-ID')}</p>
                      </div>
                    );
                })}
            </div>

            <div className="pt-6 border-t border-gray-50 space-y-6">
              {!appliedVoucher ? (
                <>
                  <div className="flex gap-2">
                    <input
                      value={voucherCode}
                      onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); }}
                      placeholder="PROMO CODE"
                      className="flex-1 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#2B59FF] transition-all font-bold text-sm"
                    />
                    <button
                      type="button"
                      onClick={applyVoucher}
                      disabled={!voucherCode || previewLoading}
                      className="p-3 bg-[#111827] text-white rounded-xl hover:bg-black disabled:opacity-30 transition-all"
                    >
                      {previewLoading ? <CircleNotch size={18} className="animate-spin" /> : <Tag size={20} weight="bold" />}
                    </button>
                  </div>
                  {voucherError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{voucherError}</p>}
                </>
              ) : (
                <div className="flex items-center justify-between bg-green-50/50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} weight="bold" className="text-green-500" />
                    <div>
                      <p className="font-black text-[#111827] text-[10px] tracking-widest">{appliedVoucher.voucher.code}</p>
                      <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">-{appliedVoucher.discount.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <button type="button" onClick={removeVoucher} className="text-gray-400 hover:text-red-500"><X size={16} weight="bold" /></button>
                </div>
              )}
            </div>
            
            <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                    <span className="font-black text-[#111827]">Rp {currentSubtotal.toLocaleString('id-ID')}</span>
                </div>
                {previewData && previewData.promo_discount > 0 && (
                   <div className="flex justify-between items-center text-[#2B59FF]">
                       <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1">
                          <Tag size={12} weight="fill" /> Promo: {previewData.applied_promo_rule?.name || 'Discount'}
                       </span>
                       <span className="font-black">-Rp {previewData.promo_discount.toLocaleString('id-ID')}</span>
                   </div>
                )}
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shipping</span>
                    <span className="font-black text-[#111827]">
                      {formData.shipping_cost > 0 ? `Rp ${formData.shipping_cost.toLocaleString('id-ID')}` : <span className="text-green-500">Free</span>}
                    </span>
                </div>
                <div className="flex justify-between items-baseline pt-4">
                    <span className="text-3xl font-black text-[#111827] tracking-tighter">Total.</span>
                    <span className="text-3xl font-black text-[#2B59FF] tracking-tighter">Rp {finalTotal.toLocaleString('id-ID')}</span>
                </div>
            </div>

            <button 
                type="submit"
                onClick={handleSubmit} 
                className={`w-full py-5 rounded-[1.5rem] text-sm font-black transition-all shadow-lg flex items-center justify-center gap-3 ${
                  loading || cart.length === 0 || !formData.address || !formData.courier_name 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-[#2B59FF] text-white hover:bg-blue-600 shadow-blue-500/20'
                }`}
                disabled={loading || cart.length === 0 || !formData.address || !formData.courier_name}
            >
              {loading ? <CircleNotch size={20} className="animate-spin" /> : <>Place Order <ArrowRight weight="bold" /></>}
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 opacity-30">
             <ShieldCheck size={14} weight="bold" />
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">Certified Secure 256-bit</span>
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
