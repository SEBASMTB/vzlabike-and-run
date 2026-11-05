"use client";

import { cn } from "@/lib/utils";

interface PaymentIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function BinanceIcon({ size = 24, className }: PaymentIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#F0B90B" />
      <path
        d="M8.5 7.5L12 4l3.5 3.5L12 11 8.5 7.5zm0 9L12 13l3.5 3.5L12 20l-3.5-3.5zm0-4.5L12 8l3.5 4L12 16l-3.5-4z"
        fill="white"
      />
    </svg>
  );
}

export function ZelleIcon({ size = 24, className }: PaymentIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#6D1ED4" />
      <path
        d="M7.5 16L12 12L7.5 8M12 16L16.5 12L12 8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PagoMovilIcon({ size = 24, className }: PaymentIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#DC2626" />
      <rect x="6" y="7" width="12" height="10" rx="1.5" stroke="white" strokeWidth="1.5" />
      <path d="M6 10h12" stroke="white" strokeWidth="1.5" />
      <circle cx="9" cy="14" r="1" fill="white" />
      <circle cx="12" cy="14" r="1" fill="white" />
    </svg>
  );
}

export function TransferIcon({ size = 24, className }: PaymentIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#2563EB" />
      <path
        d="M8 10l-3 2 3 2M16 10l3 2-3 2"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 7l-4 10"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const paymentIcons: Record<string, React.FC<PaymentIconProps>> = {
  binance: BinanceIcon,
  zelle: ZelleIcon,
  pagomovil: PagoMovilIcon,
  transferencia: TransferIcon,
};

const paymentColors: Record<string, string> = {
  binance: "bg-amber-50 border-amber-200 text-amber-800",
  zelle: "bg-purple-50 border-purple-200 text-purple-800",
  pagomovil: "bg-red-50 border-red-200 text-red-800",
  transferencia: "bg-blue-50 border-blue-200 text-blue-800",
};

const paymentLabels: Record<string, string> = {
  binance: "Binance (USDT)",
  zelle: "Zelle",
  pagomovil: "Pago Móvil",
  transferencia: "Transferencia",
};

export function PaymentMethodBadges({ className }: { className?: string }) {
  const methods = ["binance", "zelle", "pagomovil", "transferencia"] as const;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {methods.map((method) => {
        const Icon = paymentIcons[method];
        return (
          <div
            key={method}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium",
              paymentColors[method]
            )}
          >
            <Icon size={16} />
            {paymentLabels[method]}
          </div>
        );
      })}
    </div>
  );
}

export function PaymentIcon({ name, size = 20, className }: PaymentIconProps) {
  const Icon = paymentIcons[name.toLowerCase()];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}
