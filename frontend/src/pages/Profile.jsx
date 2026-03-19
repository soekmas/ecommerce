import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import Button from '../components/Button';
import { UserCircle, MapPin, Envelope, Phone, IdentificationCard, ShieldCheck, MagnifyingGlass } from 'phosphor-react';

const Profile = () => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        province: '',
        city: '',
        district: '',
        postal_code: '',
        full_address: '',
        phone: '',
        latitude: 0,
        longitude: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerInstance = useRef(null);
    const searchTimeout = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Default center (Jakarta or user location)
    const defaultCenter = [-6.2088, 106.8456];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            if (res.data && res.data.data) {
                const data = res.data.data;
                setProfile({
                    ...data,
                    province: data.province || '',
                    city: data.city || '',
                    district: data.district || '',
                    postal_code: data.postal_code || '',
                    full_address: data.full_address || '',
                    phone: data.phone || '',
                    latitude: data.latitude || 0,
                    longitude: data.longitude || 0
                });
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    };

    // Initialize Map
    useEffect(() => {
        if (loading || !mapRef.current || !window.L) return;

        const L = window.L;

        // Cleanup if exists
        if (mapInstance.current) {
            mapInstance.current.remove();
        }

        const initialLat = parseFloat(profile.latitude) || defaultCenter[0];
        const initialLng = parseFloat(profile.longitude) || defaultCenter[1];

        mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        markerInstance.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance.current);

        markerInstance.current.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            const fixedLat = lat.toFixed(6);
            const fixedLon = lng.toFixed(6);
            setProfile(prev => ({ ...prev, latitude: fixedLat, longitude: fixedLon }));
            handleReverseGeocode(fixedLat, fixedLon);
        });

        mapInstance.current.on('click', (e) => {
            const { lat, lng } = e.latlng;
            markerInstance.current.setLatLng([lat, lng]);
            const fixedLat = lat.toFixed(6);
            const fixedLon = lng.toFixed(6);
            setProfile(prev => ({ ...prev, latitude: fixedLat, longitude: fixedLon }));
            handleReverseGeocode(fixedLat, fixedLon);
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [loading]); // Only run after initial data fetch

    const handleReverseGeocode = async (lat, lon) => {
        try {
            const response = await api.get(`/auth/location/reverse?lat=${lat}&lon=${lon}`);
            const data = response.data;
            if (data && data.address) {
                const addr = data.address;
                setProfile(prev => ({
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
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            const fixedLat = latitude.toFixed(6);
            const fixedLon = longitude.toFixed(6);
            setProfile(prev => ({ ...prev, latitude: fixedLat, longitude: fixedLon }));
            
            if (mapInstance.current && markerInstance.current) {
                mapInstance.current.setView([latitude, longitude], 15);
                markerInstance.current.setLatLng([latitude, longitude]);
            }
            handleReverseGeocode(fixedLat, fixedLon);
        }, (err) => {
            alert("Unable to retrieve your location");
        });
    };

    const handleSearchLocation = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

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
        }, 800); // 800ms debounce
    };

    const selectLocation = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const fixedLat = lat.toFixed(6);
        const fixedLon = lon.toFixed(6);
        
        setProfile(prev => ({ 
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

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        // Basic phone validation (starts with 08 or 62, numeric, 10-15 chars)
        const phoneRegex = /^(08|62|\+62)[0-9]{8,13}$/;
        if (!phoneRegex.test(profile.phone.replace(/\D/g, ''))) {
            setMessage({ type: 'error', text: 'Please enter a valid Indonesian phone number (e.g. 08123456789)' });
            setSaving(false);
            return;
        }

        try {
            await api.put('/user/profile', {
                name: profile.name,
                province: profile.province,
                city: profile.city,
                district: profile.district,
                postal_code: profile.postal_code,
                full_address: profile.full_address,
                phone: profile.phone.replace(/\D/g, ''), // Send only digits
                latitude: parseFloat(profile.latitude) || 0,
                longitude: parseFloat(profile.longitude) || 0
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to update profile. Please try again.';
            setMessage({ type: 'error', text: errMsg });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading your profile...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row items-center gap-8 p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                
                <div className="relative z-10">
                    <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl ring-1 ring-gray-100">
                        <UserCircle size={80} weight="thin" className="text-blue-600" />
                    </div>
                </div>

                <div className="relative z-10 flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{profile.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                            <Envelope size={14} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-500">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                            <ShieldCheck size={14} className="text-blue-600" />
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{profile.role || 'Partner'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <aside className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Personal Details</h3>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">
                            Update your name and primary contact information.
                        </p>
                    </div>
                    <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20 space-y-4">
                        <IdentificationCard size={32} />
                        <p className="text-xs font-bold opacity-80 leading-relaxed">
                            Your identity helps us personalize your shopping experience and manage your rewards.
                        </p>
                    </div>
                </aside>

                <div className="md:col-span-2 space-y-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                    {message.text && (
                        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <ShieldCheck size={20} /> : <Phone size={20} />}
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Full Name</label>
                            <input 
                                type="text"
                                className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Phone Number</label>
                            <input 
                                type="tel"
                                className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="+62..."
                                required
                            />
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 mb-2 ml-4">
                                <MapPin size={16} weight="bold" className="text-blue-600" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Shipping Address</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Province</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={profile.province}
                                        onChange={(e) => setProfile({ ...profile, province: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">City</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={profile.city}
                                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">District (Kecamatan)</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={profile.district}
                                        onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Postal Code</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={profile.postal_code}
                                        onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Address Details</label>
                                <textarea 
                                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none resize-none min-h-[100px]"
                                    placeholder="Jl. Merdeka No. 123..."
                                    value={profile.full_address}
                                    onChange={(e) => setProfile({ ...profile, full_address: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between ml-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pin Location on Map</label>
                                    <button 
                                        type="button"
                                        onClick={handleGetLocation}
                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <MapPin size={14} weight="fill" />
                                        Use My Current Location
                                    </button>
                                </div>
                                
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MagnifyingGlass size={18} className="text-gray-400" />
                                    </div>
                                    <input 
                                        type="text"
                                        className="w-full bg-gray-50 border-none pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                        placeholder="Search area, street, or building name..."
                                        value={searchQuery}
                                        onChange={handleSearchLocation}
                                    />
                                    
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
                                            {searchResults.map((result, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => selectLocation(result)}
                                                    className="w-full text-left px-6 py-4 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-none flex flex-col gap-1"
                                                >
                                                    <span className="text-sm font-bold text-gray-900 line-clamp-1">{result.display_name.split(',')[0]}</span>
                                                    <span className="text-[10px] text-gray-500 line-clamp-1 font-medium">{result.display_name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div 
                                    ref={mapRef} 
                                    className="w-full h-64 rounded-3xl overflow-hidden border-4 border-gray-50 shadow-inner z-0"
                                    style={{ background: '#f8fafc' }}
                                ></div>
                                <p className="text-[10px] text-gray-400 font-medium ml-4 italic">* Click on the map or drag the marker to set your precise location.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Latitude (Pin)</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={profile.latitude}
                                        onChange={(e) => setProfile({ ...profile, latitude: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Longitude (Pin)</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={profile.longitude}
                                        onChange={(e) => setProfile({ ...profile, longitude: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-end">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                className="px-12 py-5 rounded-2xl shadow-xl shadow-blue-600/10"
                                disabled={saving}
                            >
                                {saving ? 'Synchronizing...' : 'Update Profile Settings'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Profile;
