import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

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
    youtube_url: '#'
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
