type PaymentBrand = 'VNPAY' | 'Momo' | 'ZaloPay' | 'VISA';

function PaymentMark({ brand }: { brand: PaymentBrand }) {
  if (brand === 'VNPAY') {
    return (
      <svg viewBox="0 0 72 24" className="h-5 w-auto" aria-hidden="true">
        <rect width="72" height="24" rx="4" fill="#005BAA" />
        <text
          x="36"
          y="16"
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontWeight="800"
          fontFamily="Arial, sans-serif"
        >
          VNPAY
        </text>
      </svg>
    );
  }
  if (brand === 'Momo') {
    return (
      <svg viewBox="0 0 72 24" className="h-5 w-auto" aria-hidden="true">
        <rect width="72" height="24" rx="4" fill="#A50064" />
        <circle cx="14" cy="12" r="5.5" fill="#fff" opacity="0.95" />
        <text
          x="44"
          y="16"
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontWeight="800"
          fontFamily="Arial, sans-serif"
        >
          MoMo
        </text>
      </svg>
    );
  }
  if (brand === 'ZaloPay') {
    return (
      <svg viewBox="0 0 84 24" className="h-5 w-auto" aria-hidden="true">
        <rect width="84" height="24" rx="4" fill="#0068FF" />
        <text
          x="42"
          y="16"
          textAnchor="middle"
          fill="#fff"
          fontSize="8.5"
          fontWeight="800"
          fontFamily="Arial, sans-serif"
        >
          ZaloPay
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 56 24" className="h-5 w-auto" aria-hidden="true">
      <rect width="56" height="24" rx="4" fill="#1A1F71" />
      <text
        x="28"
        y="16"
        textAnchor="middle"
        fill="#fff"
        fontSize="10"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
        fontStyle="italic"
      >
        VISA
      </text>
    </svg>
  );
}

const BRANDS: PaymentBrand[] = ['VNPAY', 'Momo', 'ZaloPay', 'VISA'];

export function PaymentPartnerBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="hidden text-sm font-medium text-[var(--color-muted)] sm:inline">
        Đối tác thanh toán
      </span>
      {BRANDS.map((brand) => (
        <span
          key={brand}
          title={brand}
          className="inline-flex items-center rounded-lg border border-[var(--color-line)] bg-white px-2 py-1.5 shadow-sm"
        >
          <PaymentMark brand={brand} />
          <span className="sr-only">{brand}</span>
        </span>
      ))}
    </div>
  );
}
