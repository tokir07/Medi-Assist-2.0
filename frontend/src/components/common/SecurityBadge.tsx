import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const SecurityBadge: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-600">
      <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
      <span>Your healthcare information is protected with secure authentication.</span>
    </div>
  );
};
