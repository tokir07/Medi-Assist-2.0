import React from 'react';
import { AlertCircle, CheckCircle, Info, ShieldAlert, X } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'error', message, onClose, className = '' }) => {
  const styles = {
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
    },
    info: {
      bg: 'bg-teal-50 border-teal-200 text-teal-800',
      icon: <Info className="w-5 h-5 text-teal-600 flex-shrink-0" />
    }
  };

  const currentStyle = styles[type];

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm font-medium animate-fade-in ${currentStyle.bg} ${className}`}>
      {currentStyle.icon}
      <div className="flex-1 leading-snug">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          type="button"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
