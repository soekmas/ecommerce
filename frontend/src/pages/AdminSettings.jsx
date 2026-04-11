import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { 
  Buildings, Phone, Envelope, 
  MapPin, FacebookLogo, InstagramLogo, 
  TwitterLogo, LinkedinLogo, YoutubeLogo,
  CheckCircle, FloppyDisk, BookOpen, ImageSquare, Upload
} from 'phosphor-react';
import api, { getFullUrl } from '../utils/api';

const AdminSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadingImageFor, setUploadingImageFor] = useState(null);

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // 5MB Size Validation
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: `File ${file.name} is too large. Max 5MB allowed.` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setUploadingImageFor(fieldName);
    setMessage(null);
    const formUpload = new FormData();
    formUpload.append('images', file);

    try {
      const res = await api.post('/admin/upload', formUpload); // Boundary handled by Axios
      if (res.data.data && res.data.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          [fieldName]: res.data.data[0]
        }));
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.debug_error || "Failed to upload image." });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setUploadingImageFor(null);
    }
  };

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings(formData);
      setMessage({ type: 'success', text: 'All settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tighter">General Settings</h1>
          <p className="text-gray-400 font-medium">Manage your company identity and legal documents.</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-[#2B59FF] hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-black transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20"
        >
          {saving ? 'Saving...' : <><FloppyDisk size={20} weight="bold" /> Save All Changes</>}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.type === 'success' && <CheckCircle size={20} weight="fill" />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === 'profile' ? 'bg-white text-[#2B59FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Company Profile
        </button>
        <button 
          onClick={() => setActiveTab('social')}
          className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === 'social' ? 'bg-white text-[#2B59FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Social Media
        </button>
        <button 
          onClick={() => setActiveTab('legal')}
          className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === 'legal' ? 'bg-white text-[#2B59FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Legal Pages
        </button>
        <button 
          onClick={() => setActiveTab('hero_banners')}
          className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === 'hero_banners' ? 'bg-white text-[#2B59FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Hero Banners
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-black text-[#111827] mb-6 flex items-center gap-2">
              <Buildings size={24} weight="fill" className="text-[#2B59FF]" /> Company Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400">Site Title (Browser Tab)</label>
                <input 
                  name="site_title"
                  value={formData.site_title || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                  placeholder="e.g. GoCommerce - Premium Tech Store"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400">Company Name</label>
                <input 
                  name="company_name"
                  value={formData.company_name || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                  placeholder="e.g. Go-Commerce Inc."
                />
              </div>
              
              <div className="md:col-span-2 space-y-4">
                 <label className="text-sm font-black text-gray-500">Company Logo</label>
                 <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-100 border-dashed">
                    <div className="w-32 h-32 bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-4 shadow-sm overflow-hidden shrink-0 relative group">
                       {formData.logo ? (
                         <img src={getFullUrl(formData.logo)} className="max-w-full max-h-full object-contain" alt="Logo" />
                       ) : (
                         <Buildings size={48} className="text-gray-200" weight="thin" />
                       )}
                       {uploadingImageFor === 'logo' && (
                         <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-[#2B59FF] border-t-transparent rounded-full animate-spin"></div>
                         </div>
                       )}
                    </div>
                    <div className="flex-1 space-y-3">
                       <p className="text-xs font-medium text-gray-500 leading-relaxed">
                          This logo will appear in the Navbar and Footer of your store. 
                          Recommended: **Transparent PNG** or **SVG** around 200x50px. Max 5MB.
                       </p>
                       <div className="flex gap-2">
                          <label className="px-4 py-2 bg-[#111827] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-black transition-all">
                             {formData.logo ? 'Change Logo' : 'Upload Logo'}
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                          </label>
                          {formData.logo && (
                            <button 
                              onClick={() => setFormData(p => ({...p, logo: null}))}
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                            >
                               Remove
                            </button>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                 <label className="text-sm font-black text-gray-500">Site Favicon (Browser Icon)</label>
                 <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-white rounded-xl border border-gray-100 flex items-center justify-center p-2 shadow-sm relative overflow-hidden shrink-0 group">
                       {formData.favicon ? (
                         <img src={getFullUrl(formData.favicon)} className="max-w-full max-h-full object-contain" alt="Favicon" />
                       ) : (
                         <ImageSquare size={24} className="text-gray-200" weight="thin" />
                       )}
                       {uploadingImageFor === 'favicon' && (
                         <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-[#2B59FF] border-t-transparent rounded-full animate-spin"></div>
                         </div>
                       )}
                    </div>
                    <div className="flex-1 space-y-2">
                       <p className="text-xs font-medium text-gray-500 leading-relaxed">
                          The small icon that appears in the browser tab. 
                          Recommended: **Square ICO/PNG** (32x32px). Max 5MB.
                       </p>
                       <div className="flex gap-2">
                          <label className="px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-black transition-all">
                             {formData.favicon ? 'Change Favicon' : 'Upload Favicon'}
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'favicon')} />
                          </label>
                          {formData.favicon && (
                            <button 
                              onClick={() => setFormData(p => ({...p, favicon: null}))}
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                            >
                               Remove
                            </button>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400">Public Phone</label>
                <input 
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                  placeholder="+62 ..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400">Public Email</label>
                <input 
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                  placeholder="hello@company.com"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-black text-gray-400">Google Maps Direction URL</label>
                <input 
                  name="maps_url"
                  value={formData.maps_url || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                  placeholder="https://goo.gl/maps/..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-black text-gray-400">Office Address</label>
                <textarea 
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                  placeholder="Full office address..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-black text-[#111827] mb-6 flex items-center gap-2">
              <TwitterLogo size={24} weight="fill" className="text-[#2B59FF]" /> Social Presence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'facebook_url', label: 'Facebook URL', icon: <FacebookLogo weight="bold" /> },
                { name: 'instagram_url', label: 'Instagram URL', icon: <InstagramLogo weight="bold" /> },
                { name: 'twitter_url', label: 'Twitter / X URL', icon: <TwitterLogo weight="bold" /> },
                { name: 'linkedin_url', label: 'LinkedIn URL', icon: <LinkedinLogo weight="bold" /> },
                { name: 'youtube_url', label: 'Youtube URL', icon: <YoutubeLogo weight="bold" /> },
              ].map(social => (
                <div key={social.name} className="space-y-2">
                  <label className="text-sm font-black text-gray-400 flex items-center gap-1">
                    {social.icon} {social.label}
                  </label>
                  <input 
                    name={social.name}
                    value={formData[social.name] || ''}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Pages Tab */}
        {activeTab === 'legal' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm animate-fade-in">
            <h2 className="text-xl font-black text-[#111827] mb-6 flex items-center gap-2">
              <BookOpen size={24} weight="fill" className="text-[#2B59FF]" /> Policies & Legal
            </h2>
            <div className="space-y-8">
              {[
                { name: 'privacy_policy', label: 'Privacy Policy' },
                { name: 'terms_of_use', label: 'Terms of Use' },
                { name: 'refund_policy', label: 'Refund Policy' },
                { name: 'faq', label: 'FAQ Content' },
              ].map(page => (
                <div key={page.name} className="space-y-2">
                  <label className="text-sm font-black text-[#111827] flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                    {page.label}
                  </label>
                  <textarea 
                    name={page.name}
                    value={formData[page.name] || ''}
                    onChange={handleChange}
                    rows="8"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 outline-none focus:border-[#2B59FF] focus:bg-white transition-all font-medium text-sm leading-relaxed"
                    placeholder={`Enter ${page.label} content (HTML or plain text supported)...`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hero Banners Tab */}
        {activeTab === 'hero_banners' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm animate-fade-in space-y-12">
            <h2 className="text-xl font-black text-[#111827] flex items-center gap-2">
              <ImageSquare size={24} weight="fill" className="text-[#2B59FF]" /> Homepage Hero Banners
            </h2>

            {/* Main Banner */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-gray-800 border-b pb-2">1. Main Banner (Left Large)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Sub Title (Small Blue Text)</label>
                    <input name="hero_main_subtitle" value={formData.hero_main_subtitle || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Main Title</label>
                    <input name="hero_main_title" value={formData.hero_main_title || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Description</label>
                    <textarea name="hero_main_desc" value={formData.hero_main_desc || ''} onChange={handleChange} rows="2" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Button Text & Link</label>
                    <div className="flex gap-2">
                      <input name="hero_main_btn_text" value={formData.hero_main_btn_text || ''} onChange={handleChange} className="w-1/3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" placeholder="Text" />
                      <input name="hero_main_link" value={formData.hero_main_link || ''} onChange={handleChange} className="w-2/3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" placeholder="URL" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-500">Banner Image (Transparent recommended)</label>
                  <div className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                    {formData.hero_main_image ? (
                       <img src={getFullUrl(formData.hero_main_image)} className="h-full w-full object-contain p-4 group-hover:opacity-50 transition-opacity" alt="Main" />
                    ) : (
                       <ImageSquare size={48} className="text-gray-300 mb-2" weight="thin" />
                    )}
                    <label className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all text-white font-bold gap-2">
                       <Upload size={20} weight="bold" /> {uploadingImageFor === 'hero_main_image' ? 'Uploading...' : 'Change Image'}
                       <input type="file" className="hidden" accept="image/*" disabled={uploadingImageFor === 'hero_main_image'} onChange={(e) => handleImageUpload(e, 'hero_main_image')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Side 1 Banner */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-gray-800 border-b pb-2">2. Side Banner Top</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Badge Text</label>
                    <input name="hero_side1_badge" value={formData.hero_side1_badge || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Title</label>
                    <input name="hero_side1_title" value={formData.hero_side1_title || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Description</label>
                    <input name="hero_side1_desc" value={formData.hero_side1_desc || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Link URL</label>
                    <input name="hero_side1_link" value={formData.hero_side1_link || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-500">Banner Image</label>
                  <div className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                    {formData.hero_side1_image ? (
                       <img src={getFullUrl(formData.hero_side1_image)} className="h-full w-full object-contain p-4 group-hover:opacity-50 transition-opacity" alt="Side 1" />
                    ) : (
                       <ImageSquare size={48} className="text-gray-300 mb-2" weight="thin" />
                    )}
                    <label className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all text-white font-bold gap-2">
                       <Upload size={20} weight="bold" /> {uploadingImageFor === 'hero_side1_image' ? 'Uploading...' : 'Change Image'}
                       <input type="file" className="hidden" accept="image/*" disabled={uploadingImageFor === 'hero_side1_image'} onChange={(e) => handleImageUpload(e, 'hero_side1_image')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Banner */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-gray-800 border-b pb-2">3. Side Banner Bottom (Accessories)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Title</label>
                    <input name="hero_bottom_title" value={formData.hero_bottom_title || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Description</label>
                    <input name="hero_bottom_desc" value={formData.hero_bottom_desc || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-500">Link URL</label>
                    <input name="hero_bottom_link" value={formData.hero_bottom_link || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-500">Background/Icon Image (Optional)</label>
                  <div className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                    {formData.hero_bottom_image ? (
                       <img src={getFullUrl(formData.hero_bottom_image)} className="h-full w-full object-contain group-hover:opacity-50 transition-opacity" alt="Bottom" />
                    ) : (
                       <div className="text-center text-gray-400 text-xs font-bold">No Image<br />(Will display default Icon)</div>
                    )}
                    <label className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all text-white font-bold gap-2">
                       <Upload size={20} weight="bold" /> {uploadingImageFor === 'hero_bottom_image' ? 'Uploading...' : 'Change Image'}
                       <input type="file" className="hidden" accept="image/*" disabled={uploadingImageFor === 'hero_bottom_image'} onChange={(e) => handleImageUpload(e, 'hero_bottom_image')} />
                    </label>
                    {formData.hero_bottom_image && (
                      <button type="button" onClick={(e) => { e.preventDefault(); setFormData(p => ({...p, hero_bottom_image: null})); }} className="absolute bottom-2 right-2 px-2 py-1 bg-red-500 text-white text-[10px] uppercase font-black tracking-wider rounded-lg z-10 hover:bg-red-600 transition-all cursor-pointer">Remove</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
