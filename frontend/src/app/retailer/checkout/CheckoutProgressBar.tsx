// app/retailer/checkout/CheckoutProgressBar.tsx
'use client';

const STEPS = ['Confirm Order', 'Shipping & Confirm', 'Payment'];

export default function CheckoutProgressBar({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center py-8">
      {STEPS.map((label, idx) => {
        const step = idx + 1;
        const done = step < currentStep;
        const active = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? 'bg-[#2B6E44] text-white' : active ? 'bg-[#2B6E44] text-white ring-4 ring-[#2B6E44]/20' : 'bg-white border-2 border-gray-200 text-gray-400'}
                `}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                ) : step}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-[#2B6E44]' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className={`w-32 sm:w-48 h-0.5 mx-2 mb-5 transition-colors ${done ? 'bg-[#2B6E44]' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}