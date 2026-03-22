// components/dashboard/RecentOrdersTable.tsx
'use client';

/**
 * RECENT ORDERS TABLE
 * 
 * Displays farmer's recent transactions with retailers.
 * Shows order ID, retailer name, amount, and status.
 * 
 * Props:
 * - orders: array of order objects
 * 
 * Features:
 * - Status badges with different colors
 * - Export to CSV functionality
 * - Responsive design
 */

interface Order {
  id: string;
  retailerName: string;
  amount: number;
  status: "RELEASED" | "DELIVERED" | "FUNDS_LOCKED" | "INITIATED";
}

interface RecentOrdersTableProps {
  orders: Order[];
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const handleDownloadCSV = () => {
    // In production, generate and download CSV
    console.log('Downloading CSV...');
    alert('CSV download would start here');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-500 mt-1">
              Track your latest delivery status and payment lifecycle
            </p>
          </div>
          
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            <DownloadIcon />
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Order ID
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Retailer Name
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Amount
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-6">
                  <span className="font-mono font-semibold text-gray-900">
                    #{order.id}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-700">{order.retailerName}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="font-semibold text-gray-900">
                    ${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State (if no orders) */}
      {orders.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500">No recent orders found</p>
        </div>
      )}
    </div>
  );
}

/**
 * STATUS BADGE SUB-COMPONENT
 * 
 * Displays colored badge based on order status
 */
function StatusBadge({ status }: { status: Order['status'] }) {
  const statusConfig = {
    RELEASED: {
      label: 'Released',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
    DELIVERED: {
      label: 'Delivered',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    FUNDS_LOCKED: {
      label: 'Funds Locked',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    INITIATED: {
      label: 'Initiated',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}

// Download Icon
function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}