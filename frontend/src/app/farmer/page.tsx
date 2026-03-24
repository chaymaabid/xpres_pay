// app/dashboard/farmer/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardStats from './components/DashboardStats';
import ProofOfDeliverySection from './components/Proofofdelivery';
import RecentOrdersTable from './components/Recentorderstable';
import TrustScoreCard from './components/trustscorecard';

/**
 * FARMER DASHBOARD HOME PAGE
 * 
 * Main dashboard showing:
 * - Financial stats
 * - Proof of delivery scanner
 * - Recent orders
 * - Trust score
 */

export default async function FarmerDashboardHome() {
  const session = await getServerSession(authOptions);

  if (!session || session.role !== 'FARMER') {
    redirect('/auth');
  }

  // Mock data (replace with API calls)
  const mockStats = {
    availableBalance: 12450.00,
    lockedInEscrow: 4820.50,
    microCreditLimit: 25000.00,
    trustScore: 850,
    trustScoreChange: 12,
  };

  const mockRecentOrders = [
    {
      id: 'ORD-9281',
      retailerName: 'GreenValley Mart',
      amount: 1200.00,
      status: 'RELEASED' as const,
    },
    {
      id: 'ORD-9275',
      retailerName: 'Organic Hub Ltd',
      amount: 450.50,
      status: 'DELIVERED' as const,
    },
    {
      id: 'ORD-9268',
      retailerName: 'Metro Grocers',
      amount: 3170.00,
      status: 'FUNDS_LOCKED' as const,
    },
    {
      id: 'ORD-9262',
      retailerName: 'Rural Supply Co',
      amount: 980.00,
      status: 'INITIATED' as const,
    },
    {
      id: 'ORD-9259',
      retailerName: 'FreshWay Retail',
      amount: 1200.00,
      status: 'INITIATED' as const,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 mt-16">
        <h1 className="text-3xl font-bold text-gray-900">
          Farmer Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Good morning, {session.user?.email?.split('@')[0]}. Your trust score increased by{' '}
          <span className="text-[#2B6E44] font-semibold">
            +{mockStats.trustScoreChange} pts
          </span>{' '}
          last week.
        </p>
      </div>

      {/* Stats Grid */}
      <DashboardStats
        availableBalance={mockStats.availableBalance}
        lockedInEscrow={mockStats.lockedInEscrow}
        microCreditLimit={mockStats.microCreditLimit}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ProofOfDeliverySection />
          <RecentOrdersTable orders={mockRecentOrders} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          <TrustScoreCard
            score={mockStats.trustScore}
            maxScore={1000}
          />
        </div>
      </div>
    </div>
  );
}