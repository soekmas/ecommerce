import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-medium tracking-tight transition-all duration-200 active:scale-[0.98] px-5 py-2 rounded-2xl focus:outline-none";
  
  const variants = {
    primary: "bg-[#0071e3] text-white hover:bg-[#0077ed]",
    secondary: "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]",
    outline: "border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7]",
    danger: "bg-[#e3000f] text-white hover:bg-[#f20013]",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
