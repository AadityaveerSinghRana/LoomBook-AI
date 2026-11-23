import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const variants = {
    primary: 'bg-white text-black hover:bg-white/90 active:scale-[0.99]',
    secondary:
      'bg-[#101014] text-white border border-white/15 hover:bg-white/10 hover:border-white/30',
    outline:
      'border border-white/15 bg-transparent text-white/80 hover:bg-white/10 hover:text-white',
    ghost: 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white',
    danger: 'bg-[#2A1215] text-[#FCA5A5] border border-[#7F1D1D] hover:bg-[#3B171B]',
  };

  const sizes = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-11 px-6 text-sm',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};