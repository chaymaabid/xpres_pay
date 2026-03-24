// components/dashboard/DashboardStats.tsx
/**
 * DASHBOARD STATS COMPONENT
 * 
 * Displays three financial stat cards:
 * 1. Available Balance - funds released from escrow
 * 2. Locked in Escrow - funds waiting for delivery confirmation
 * 3. Micro-Credit Limit - based on trust score
 * 
 * Props:
 * - availableBalance: number - current available balance
 * - lockedInEscrow: number - amount currently in escrow
 * - microCreditLimit: number - credit limit based on trust
 */

interface DashboardStatsProps {
  availableBalance: number;
  lockedInEscrow: number;
  microCreditLimit: number;
}

export default function DashboardStats({
  availableBalance,
  lockedInEscrow,
  microCreditLimit,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Available Balance Card */}
      <StatCard
        icon={<UnlockIcon />}
        label="AVAILABLE BALANCE"
        value={availableBalance}
        subtitle="Funds released from Escrow"
        iconBgColor="bg-green-50"
      />

      {/* Locked in Escrow Card */}
      <StatCard
        icon={<LockIcon />}
        label="LOCKED IN ESCROW"
        value={lockedInEscrow}
        subtitle="Pending deliveries"
        iconBgColor="bg-blue-50"
      />

      {/* Micro-Credit Limit Card */}
      <StatCard
        icon={<CreditCardIcon />}
        label="MICRO-CREDIT LIMIT"
        value={microCreditLimit}
        subtitle="Based on your trust score"
        iconBgColor="bg-purple-50"
        actionLink="/dashboard/farmer/credits"
        actionLabel="show all credits"
      />
    </div>
  );
}

/**
 * STAT CARD SUB-COMPONENT
 * 
 * Reusable card for displaying a single stat
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  iconBgColor: string;
  actionLink?: string;
  actionLabel?: string;
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  iconBgColor,
  actionLink,
  actionLabel,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {/* Icon */}
      <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </p>

      {/* Value */}
      <p className="text-3xl font-bold text-gray-900 mb-2">
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>

      {/* Subtitle or Action Link */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <InfoIcon className="w-4 h-4" />
          {subtitle}
        </p>
        
        {actionLink && actionLabel && (
          <a
            href={actionLink}
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowRightIcon className="w-3 h-3" />
            {actionLabel}
          </a>
        )}
      </div>
    </div>
  );
}

// Icon Components
function UnlockIcon() {
  return (
    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}