import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ variant = 'horizontal', className = '' }) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 group ${className}`}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <rect width="36" height="36" rx="8" fill="#0f7a5a" />
        <path d="M9 18L14 9h8l5 9-5 9h-8l-5-9z" fill="white" fillOpacity="0.15" />
        <path d="M12 18L16 11h4l4 7-4 7h-4l-4-7z" fill="white" />
        <circle cx="18" cy="18" r="3" fill="#0f7a5a" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-lg tracking-tight text-gray-900 group-hover:text-primary-500 transition-colors">
          MiProfesional
        </span>
        <span className="text-[10px] font-medium text-gray-400 tracking-widest uppercase -mt-0.5">
          Marketplace
        </span>
      </div>
    </Link>
  );
};

export const LogoIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width={size} height={size} rx="8" fill="#0f7a5a" />
    <path d="M12 18L16 11h4l4 7-4 7h-4l-4-7z" fill="white" />
    <circle cx="18" cy="18" r="3" fill="#0f7a5a" />
  </svg>
);

export const LogoWhite = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="36" height="36" rx="8" fill="white" fillOpacity="0.15" />
    <path d="M12 18L16 11h4l4 7-4 7h-4l-4-7z" fill="white" />
    <circle cx="18" cy="18" r="3" fill="#0f7a5a" />
  </svg>
);

export default Logo;
