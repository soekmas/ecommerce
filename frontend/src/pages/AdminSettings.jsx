import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { 
  Buildings, Phone, Envelope, 
  MapPin, FacebookLogo, InstagramLogo, 
  TwitterLogo, LinkedinLogo, YoutubeLogo,
  CheckCircle, FloppyDisk, BookOpen
} from 'phosphor-react';

const AdminSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

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
                <label className="text-sm font-black text-gray-400">Company Name</label>
                <input 
                  name="company_name"
                  value={formData.company_name || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2B59FF] transition-all font-bold"
                  placeholder="e.g. Go-Commerce Inc."
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
      </div>
    </div>
  );
};

export default AdminSettings;
