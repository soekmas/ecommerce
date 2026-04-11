import React, { useEffect } from 'react';
import { X } from 'phosphor-react';

const AdminModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = 'md',
  bodyRef,
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
    '2xl': 'max-w-7xl',
    '3xl': 'max-w-[85vw]',
    '4xl': 'max-w-[95vw]',
    full: 'max-w-none'
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
          : `${sizeClasses[size] || sizeClasses.md} max-h-[90vh] rounded-[2rem]`
        }
      `}>
        {/* Header (Fixed) */}
        <div className="px-10 pt-10 pb-4 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Body Content (Scrollable) */}
        <div ref={bodyRef} className="px-10 py-2 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-6 pb-10">
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
