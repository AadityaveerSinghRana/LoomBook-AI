import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-white/65">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
            <Icon size={16} strokeWidth={1.75} />
          </div>
        )}
        <input
          className={`w-full rounded-lg border border-white/15 bg-[#0A0A0D] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 transition-colors focus:border-white focus:outline-none focus:ring-2 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-50 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-[#EF4444] focus:border-[#EF4444]' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-[#FCA5A5]">{error}</p>}
    </div>
  );
};