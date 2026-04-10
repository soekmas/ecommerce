import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { House, CaretRight } from 'phosphor-react';

const ContentPage = () => {
  const { slug } = useParams();
  const { settings } = useSettings();

  // Map slug to settings key
  const pageMap = {
    'privacy-policy': { title: 'Privacy Policy', key: 'privacy_policy' },
    'terms-of-use': { title: 'Terms of Use', key: 'terms_of_use' },
    'refund-policy': { title: 'Refund Policy', key: 'refund_policy' },
    'faq': { title: 'Frequently Asked Questions', key: 'faq' }
  };

  const page = pageMap[slug];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!page) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">Back to Home</Link>
      </div>
    );
  }

  const content = settings[page.key] || `<p class="text-gray-400 italic">Content for ${page.title} is being updated. Please check back later.</p>`;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-gray-50 border-b border-gray-100 py-12 mb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-4xl font-black text-[#111827] tracking-tighter">{page.title}</h1>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Link to="/" className="text-gray-400 hover:text-[#2B59FF] transition-colors flex items-center gap-1">
                <House size={18} /> Home
              </Link>
              <CaretRight size={14} className="text-gray-300" />
              <span className="text-[#111827]">{page.title}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-100 rounded-[3rem] p-8 md:p-16 shadow-sm">
          <div 
            className="prose prose-lg max-w-none text-gray-600 leading-relaxed font-medium
              prose-headings:text-[#111827] prose-headings:font-black prose-headings:tracking-tight
              prose-p:mb-6 prose-li:mb-2 prose-strong:text-[#111827] prose-strong:font-black
              prose-a:text-[#2B59FF] prose-a:font-bold hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
          />
        </div>
        
        {/* Support Banner */}
        <div className="mt-12 p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
              <h3 className="text-xl font-black text-[#111827]">Need more help?</h3>
              <p className="text-gray-500 font-medium">Our support team is available 24/7 for your inquiries.</p>
           </div>
           <Link to="/contact" className="px-8 py-4 bg-[#2B59FF] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
              Contact Support
           </Link>
        </div>
      </div>
    </div>
  );
};

export default ContentPage;
