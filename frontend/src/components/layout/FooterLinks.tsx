import React from 'react';
import { Link } from 'react-router-dom';

export const FooterLinks: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <footer className={`flex items-center justify-center gap-4 text-xs text-[#5F6F86] ${className}`}>
      <Link to="/privacy" className="hover:text-[#102A56] transition-colors">
        Privacy Policy
      </Link>
      <span className="text-[#D9E1EA]">|</span>
      <Link to="/terms" className="hover:text-[#102A56] transition-colors">
        Terms of Service
      </Link>
      <span className="text-[#D9E1EA]">|</span>
      <Link to="/contact" className="hover:text-[#102A56] transition-colors">
        Contact Us
      </Link>
    </footer>
  );
};
