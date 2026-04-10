import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Envelope, MapPin,
  Headset, NavigationArrow,
  Truck, Smiley, ShieldCheck, Clock, House
} from 'phosphor-react';
import { useSettings } from '../context/SettingsContext';

const Contact = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="animate-fade-in pb-0">
      <div className="bg-white border-b border-gray-100 py-10 mb-10 overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-bounce">
                <Headset size={32} weight="fill" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#111827] tracking-tighter">Contact Us</h1>
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">24/7 Support Center</p>
              </div>
           </div>
           <div className="flex items-center gap-2 text-sm font-medium">
              <Link to="/" className="text-gray-400 hover:text-[#2B59FF] transition-colors flex items-center gap-1">
                <House size={16} /> Home
              </Link>
              <span className="text-gray-200">/</span>
              <span className="text-gray-900 font-bold">Support Center</span>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* ── LEFT: Contact Form ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-[#111827] mb-6">Make Custom Request</h2>

            {success ? (
              <div className="py-16 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 text-3xl">✓</div>
                <h3 className="text-xl font-black text-[#111827]">Message Sent!</h3>
                <p className="text-gray-400 text-sm font-medium">We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-sm font-bold text-[#2B59FF] underline underline-offset-2 hover:text-blue-700 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#2B59FF] focus:ring-2 focus:ring-[#2B59FF]/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#2B59FF] focus:ring-2 focus:ring-[#2B59FF]/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="Phone Number*"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#2B59FF] focus:ring-2 focus:ring-[#2B59FF]/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#2B59FF] focus:ring-2 focus:ring-[#2B59FF]/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="5"
                    placeholder="Type your message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#2B59FF] focus:ring-2 focus:ring-[#2B59FF]/10 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-[#2B59FF] hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* ── RIGHT: Contact Info ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-[#111827]">Get In Touch</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[#2B59FF] flex-shrink-0">
                  <Phone size={16} weight="fill" />
                </div>
                <span className="text-sm font-medium text-gray-600">{settings.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[#2B59FF] flex-shrink-0">
                  <Envelope size={16} weight="fill" />
                </div>
                <span className="text-sm font-medium text-gray-600">{settings.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[#2B59FF] flex-shrink-0">
                  <MapPin size={16} weight="fill" />
                </div>
                <span className="text-sm font-medium text-gray-600 whitespace-pre-line">{settings.address}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a 
                href={`tel:${settings.phone}`}
                className="flex items-center gap-4 w-full p-4 bg-white border border-gray-100 rounded-2xl hover:border-[#2B59FF] hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#2B59FF] group-hover:bg-[#2B59FF] group-hover:text-white transition-all">
                  <Headset size={24} weight="bold" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Available 24/7</p>
                  <p className="text-sm font-black text-[#111827]">Get Support On Call</p>
                </div>
              </a>

              <a 
                href={settings.maps_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 w-full p-4 bg-white border border-gray-100 rounded-2xl hover:border-[#2B59FF] hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#2B59FF] group-hover:bg-[#2B59FF] group-hover:text-white transition-all">
                  <NavigationArrow size={24} weight="bold" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Visit Office</p>
                  <p className="text-sm font-black text-[#111827]">Get Direction</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Strip ── */}
      <div className="bg-blue-50/50 border-t border-blue-100/50 py-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Truck size={28} weight="fill" />, label: 'Free Shipping', desc: 'Secure delivery worldwide' },
              { icon: <Smiley size={28} weight="fill" />, label: '100% Satisfaction', desc: 'Quality products guaranteed' },
              { icon: <ShieldCheck size={28} weight="fill" />, label: 'Secure Payments', desc: 'Protected by encrypted SSL' },
              { icon: <Clock size={28} weight="fill" />, label: '24/7 Support', desc: 'Ready to help anytime' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-[#2B59FF] flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-black text-[#111827]">{item.label}</p>
                  <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

