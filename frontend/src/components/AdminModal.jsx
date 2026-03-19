import React, { useEffect } from 'react';
import { X } from 'phosphor-react';

const AdminModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = 'md',
  variant = 'centered' // 'centered' or 'drawer'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[95vw]'
  };

  const isDrawer = variant === 'drawer';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      {/* Click-out Overlay */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className={`
        relative bg-white flex flex-col shadow-2xl w-full animate-zoom-in overflow-hidden
        ${variant === 'full-screen' 
          ? 'h-screen w-screen !rounded-none !max-w-none'
          : `max-w-xl max-h-[90vh] rounded-[1.5rem]`
        }
      `}>
        {/* Header (Fixed) */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body Content (Scrollable) */}
        <div className="px-8 py-2 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            {children}
          </div>
        </div>

        {/* Footer (Fixed) */}
        {footer && (
          <div className="px-8 pt-4 pb-8 flex items-center justify-center gap-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;
