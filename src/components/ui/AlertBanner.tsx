import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface AlertBannerProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}

export default function AlertBanner({
  variant,
  message,
  className = '',
}: AlertBannerProps) {
  const config = {
    success: { bg: 'bg-[#F5FFF5] border-[#D4F4DD]', icon: CheckCircle, color: 'text-[#34C759]' },
    error: { bg: 'bg-[#FFF5F5] border-[#FFE5E5]', icon: XCircle, color: 'text-[#FF3B30]' },
    warning: { bg: 'bg-[#FFF9F0] border-[#FFE5CC]', icon: AlertCircle, color: 'text-[#FF9500]' },
    info: { bg: 'bg-[#F0F9FF] border-[#BFDBFE]', icon: Info, color: 'text-[#0096BC]' },
  };

  const { bg, icon: Icon, color } = config[variant];

  return (
    <div className={`${bg} border rounded-[12px] p-4 flex items-center gap-3 ${className}`}>
      <Icon className={`w-5 h-5 ${color} flex-shrink-0`} strokeWidth={1.5} />
      <span className="text-[#1D1D1F] text-[14px]">{message}</span>
    </div>
  );
}
