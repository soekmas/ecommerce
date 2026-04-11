import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getFullUrl } from '../utils/api';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    company_name: 'GoCommerce',
    phone: '+62 812 3456 7890',
    email: 'support@gocommerce.com',
    address: 'Jl. Tech Valley No. 10, Jakarta, Indonesia',
    maps_url: '#',
    facebook_url: '#',
    instagram_url: '#',
    twitter_url: '#',
    linkedin_url: '#',
    youtube_url: '#',
    hero_main_title: 'iPhone 15 Pro.<br/><span class="text-gray-400">Titanium Power.</span>',
    hero_main_subtitle: 'New Arrival',
    hero_main_desc: 'Experience the next era of performance with the A17 Pro chip and lightweight titanium design.',
    hero_main_link: '#',
    hero_main_btn_text: 'Explore Now',
    hero_main_image: '/hero_banner_iphone_1775018828339.png',
    hero_side1_badge: "Editor's Choice",
    hero_side1_title: 'Watch Ultra 2.',
    hero_side1_desc: 'The most capable watch.',
    hero_side1_link: '#',
    hero_side1_image: '/hero_banner_watch_1775019052766.png',
    hero_bottom_title: 'Accessories',
    hero_bottom_desc: 'Elevate your set-up.',
    hero_bottom_image: null
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data && res.data.data) {
        // Merge fetched settings with defaults
        setSettings(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Sync document title with site_title setting
  useEffect(() => {
    if (settings.site_title) {
      document.title = settings.site_title;
    } else if (settings.company_name) {
      document.title = settings.company_name;
    }
  }, [settings.site_title, settings.company_name]);

  // Sync favicon with favicon setting
  useEffect(() => {
    const faviconLink = document.getElementById('favicon-link');
    if (faviconLink) {
      if (settings.favicon) {
        faviconLink.href = getFullUrl(settings.favicon);
        faviconLink.removeAttribute('type'); // Let browser infer from URL
      } else {
        faviconLink.href = '/favicon.svg';
        faviconLink.type = 'image/svg+xml';
      }
    }
  }, [settings.favicon]);

  const updateSettings = async (newSettings) => {
    try {
      await api.patch('/admin/settings', { settings: newSettings });
      setSettings(prev => ({ ...prev, ...newSettings }));
      return { success: true };
    } catch (err) {
      console.error("Failed to update settings:", err);
      return { success: false, error: err };
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
