import React from 'react';

export interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function PrimaryButton({
  children,
  onClick,
  variant = 'primary',
  leftIcon,
  rightIcon,
  disabled = false,
  className = '',
}: PrimaryButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 px-8 py-3 rounded-xl
        transition-all font-medium text-[15px]
        ${isPrimary 
          ? 'bg-[#0096BC] hover:bg-[#007EA1] text-white' 
          : 'bg-white border border-[#E5E5E5] text-[#1D1D1F] hover:border-[#0096BC]'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'}
        ${className}
      `}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}
