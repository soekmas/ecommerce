import React from 'react';
import { Link } from 'react-router-dom';
import { FacebookLogo, TwitterLogo, InstagramLogo, YoutubeLogo, PaperPlaneTilt, AppStoreLogo, GooglePlayLogo, LinkedinLogo } from 'phosphor-react';
import { useSettings } from '../context/SettingsContext';

const Footer = () => {
  const { settings } = useSettings();

  return (
    <footer className="bg-white pt-16">
      {/* Premium Newsletter Section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-gradient-to-br from-[#2B59FF] via-[#1E40AF] to-[#1E3A8A] rounded-2xl p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/20">
          
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] -mr-32 -mt-32 transition-all duration-700 group-hover:bg-blue-300/30" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />
          
          <div className="relative z-10 max-w-2xl space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
              <span className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Exclusive Offers</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tighter">
              Join our newsletter and get <span className="text-blue-300">$20 discount</span> for your first order
            </h2>
            <p className="text-blue-100/70 font-medium max-w-md mx-auto lg:mx-0">
              Stay ahead with the latest electronics and gadget deals. We promise no spam, just premium tech updates.
            </p>
          </div>
          
          <div className="relative z-10 w-full lg:w-auto">
            <form className="flex flex-col sm:flex-row bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-2 w-full lg:w-[480px] shadow-inner">
              <input 
                type="email" 
                placeholder="Enter your professional email" 
                className="flex-1 bg-transparent px-6 py-4 text-white placeholder-blue-200/50 outline-none font-bold text-sm"
              />
              <button className="bg-white hover:bg-blue-50 text-[#2B59FF] px-8 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 group/btn">
                Subscribe Now <PaperPlaneTilt size={20} weight="bold" className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </form>
            <p className="mt-4 text-center lg:text-left text-[11px] font-bold text-blue-200/40 uppercase tracking-widest">
              Trusted by 50,000+ tech lovers worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-gray-100">
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-[#111827]">Support</h3>
          <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
            {settings.address}
          </p>
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#111827]">{settings.email}</p>
            <p className="text-sm font-bold text-[#111827]">{settings.phone}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-[#111827]">Account</h3>
          <ul className="space-y-3">
            {[
              { n: 'My Profile', p: '/profile' },
              { n: 'Login / Register', p: '/login' },
              { n: 'My Cart', p: '/cart' },
              { n: 'My Orders', p: '/orders' },
              { n: 'Shop Catalog', p: '/shop' }
            ].map(item => (
              <li key={item.n}>
                <Link to={item.p} className="text-sm text-gray-500 hover:text-[#2B59FF] transition-colors">{item.n}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-[#111827]">Quick Link</h3>
          <ul className="space-y-3">
            {[
              { n: 'Privacy Policy', p: '/p/privacy-policy' },
              { n: 'Terms Of Use', p: '/p/terms-of-use' },
              { n: 'FAQ', p: '/p/faq' },
              { n: 'Contact', p: '/contact' },
              { n: 'Refund Policy', p: '/p/refund-policy' }
            ].map(item => (
              <li key={item.n}>
                <Link to={item.p} className="text-sm text-gray-500 hover:text-[#2B59FF] transition-colors">{item.n}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-[#111827]">Download App</h3>
          <p className="text-gray-500 text-xs font-medium">Save $3 with App & New User only</p>
          <div className="flex flex-col gap-3">
            <button className="flex items-center gap-3 px-6 py-3 bg-[#F3F4F6] rounded-2xl hover:bg-gray-200 transition-all group">
              <AppStoreLogo size={28} weight="fill" className="text-[#111827]" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">Download on the</p>
                <p className="text-sm font-bold text-[#111827]">App Store</p>
              </div>
            </button>
            <button className="flex items-center gap-3 px-6 py-3 bg-[#F3F4F6] rounded-2xl hover:bg-gray-200 transition-all group">
              <GooglePlayLogo size={28} weight="fill" className="text-[#111827]" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">Get it on</p>
                <p className="text-sm font-bold text-[#111827]">Google Play</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-sm text-gray-400 font-medium">© {new Date().getFullYear()} {settings.company_name}. All Rights Reserved.</p>
        
        <div className="flex items-center justify-center md:justify-start gap-6">
          <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#2B59FF] transition-all hover:scale-110">
            <FacebookLogo size={26} weight="regular" />
          </a>
          <a href={settings.twitter_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-all hover:scale-110">
            <TwitterLogo size={26} weight="regular" />
          </a>
          <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#E4405F] transition-all hover:scale-110">
            <InstagramLogo size={26} weight="regular" />
          </a>
          <a href={settings.linkedin_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#0A66C2] transition-all hover:scale-110">
            <LinkedinLogo size={26} weight="regular" />
          </a>
          <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#FF0000] transition-all hover:scale-110">
            <YoutubeLogo size={26} weight="regular" />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
           <img src="https://logodownload.org/wp-content/uploads/2016/10/visa-logo-1.png" alt="Visa" className="h-5" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-9" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="h-8" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

