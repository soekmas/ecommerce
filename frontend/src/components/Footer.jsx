import React from 'react';
import { Link } from 'react-router-dom';
import { FacebookLogo, TwitterLogo, InstagramLogo, YoutubeLogo, PaperPlaneTilt, AppStoreLogo, GooglePlayLogo } from 'phosphor-react';

const Footer = () => {
  return (
    <footer className="bg-white pt-16">
      {/* Newsletter Section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-[#2B59FF] rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden group">
          <div className="relative z-10 max-w-lg space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">Join our newsletter and get $20 discount for your first order</h2>
            <p className="text-blue-100 font-medium">We’ll never share your email address with a third-party.</p>
          </div>
          
          <div className="relative z-10 w-full md:w-auto">
            <form className="flex bg-white rounded-full p-2 w-full md:w-[450px]">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 bg-transparent px-6 py-3 text-[#111827] placeholder-gray-400 outline-none font-medium"
              />
              <button className="bg-[#111827] hover:bg-black text-white px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2">
                Subscribe <PaperPlaneTilt size={20} weight="bold" />
              </button>
            </form>
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-gray-100">
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-[#111827]">Support</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            685 Market Street <br />
            San Francisco, CA 94105, <br />
            United States
          </p>
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#111827]">support@gocommerce.com</p>
            <p className="text-sm font-bold text-[#111827]">(+01) 850-315-5862</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-[#111827]">Account</h3>
          <ul className="space-y-3">
            {['My Account', 'Login / Register', 'Cart', 'Wishlist', 'Shop'].map(item => (
              <li key={item}>
                <Link to="#" className="text-sm text-gray-500 hover:text-[#2B59FF] transition-colors">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-[#111827]">Quick Link</h3>
          <ul className="space-y-3">
            {['Privacy Policy', 'Terms Of Use', 'FAQ', 'Contact', 'Refund Policy'].map(item => (
              <li key={item}>
                <Link to="#" className="text-sm text-gray-500 hover:text-[#2B59FF] transition-colors">{item}</Link>
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
        <p className="text-sm text-gray-400 font-medium">© 2024 Go-Commerce. All Rights Reserved.</p>
        
        <div className="flex items-center gap-6">
          <FacebookLogo size={20} className="text-gray-400 hover:text-[#2B59FF] cursor-pointer transition-colors" />
          <TwitterLogo size={20} className="text-gray-400 hover:text-[#2B59FF] cursor-pointer transition-colors" />
          <InstagramLogo size={20} className="text-gray-400 hover:text-[#2B59FF] cursor-pointer transition-colors" />
          <YoutubeLogo size={20} className="text-gray-400 hover:text-[#2B59FF] cursor-pointer transition-colors" />
        </div>

        <div className="flex items-center gap-4 grayscale opacity-50">
           {/* Mock payment icons */}
           <div className="w-10 h-6 bg-gray-200 rounded" />
           <div className="w-10 h-6 bg-gray-200 rounded" />
           <div className="w-10 h-6 bg-gray-200 rounded" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
