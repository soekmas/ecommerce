import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { 
  Buildings, Phone, Envelope, 
  MapPin, FacebookLogo, InstagramLogo, 
  TwitterLogo, LinkedinLogo, YoutubeLogo,
  CheckCircle, FloppyDisk
} from 'phosphor-react';

const AdminSettings = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const result = await updateSettings(formData);
    
    if (result.success) {
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Failed to update settings. Please try again.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#111827]">General Settings</h1>
          <p className="text-gray-500 font-medium">Manage your company profile and social media links</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-2 font-bold ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          <CheckCircle size={20} /> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Info */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
          <h2 className="text-xl font-black text-[#111827] mb-6 flex items-center gap-2">
            <Buildings size={24} weight="fill" className="text-[#2B59FF]" /> Company Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-400">Company Name</label>
              <input 
                name="company_name"
                value={formData.company_name || ''}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                placeholder="e.g. GoCommerce"
              />
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
                rows="2"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                placeholder="Jl. ..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
          <h2 className="text-xl font-black text-[#111827] mb-6 flex items-center gap-2">
            <FacebookLogo size={24} weight="fill" className="text-[#2B59FF]" /> Social Media Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <FacebookLogo size={32} className="text-blue-600" />
              <input 
                name="facebook_url"
                value={formData.facebook_url || ''}
                onChange={handleChange}
                placeholder="Facebook URL"
                className="bg-transparent border-none outline-none font-bold w-full"
              />
            </div>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <InstagramLogo size={32} className="text-pink-600" />
              <input 
                name="instagram_url"
                value={formData.instagram_url || ''}
                onChange={handleChange}
                placeholder="Instagram URL"
                className="bg-transparent border-none outline-none font-bold w-full"
              />
            </div>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <TwitterLogo size={32} className="text-blue-400" />
              <input 
                name="twitter_url"
                value={formData.twitter_url || ''}
                onChange={handleChange}
                placeholder="Twitter URL"
                className="bg-transparent border-none outline-none font-bold w-full"
              />
            </div>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <LinkedinLogo size={32} className="text-blue-800" />
              <input 
                name="linkedin_url"
                value={formData.linkedin_url || ''}
                onChange={handleChange}
                placeholder="LinkedIn URL"
                className="bg-transparent border-none outline-none font-bold w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#2B59FF] text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'} <FloppyDisk size={20} weight="bold" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
