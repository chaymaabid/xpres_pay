// components/dashboard/FarmerSidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * FARMER SIDEBAR NAVIGATION
 * 
 * Left sidebar with icon-based navigation for farmer dashboard.
 * Collapses to show only icons, expands to show labels.
 * 
 * Navigation Items:
 * - Home (Dashboard overview)
 * - My Products (Product listing & management)
 * - Product Catalog (Browse all products)
 * - Credit Line (View credit status)
 * - Security Settings (Account security)
 * 
 * Features:
 * - Active state highlighting
 * - Hover tooltips when collapsed
 * - Smooth transitions
 * - Responsive (auto-collapse on mobile)
 */

export default function FarmerSidebar() {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Home',
      href: '/farmer',
      icon: <HomeIcon />,
      description: 'Dashboard overview',
    },
    {
      name: 'My Products',
      href: '/farmer/products',
      icon: <ProductsIcon />,
      description: 'Manage your products',
    },
    {
      name: 'Product Catalog',
      href: '/farmer/catalog',
      icon: <CatalogIcon />,
      description: 'Browse all products',
    },
    {
      name: 'Credit Line',
      href: '/farmer/credits',
      icon: <CreditIcon />,
      description: 'View credit status',
    },
    {
      name: 'Security Settings',
      href: '/farmer/security',
      icon: <SecurityIcon />,
      description: 'Account security',
    },
  ];

  return (
    <aside className="fixed left-0 top-[3.7rem] h-screen w-[72px] hover:w-[240px] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out group z-40 overflow-hidden">
      <div className="flex flex-col h-full">
        

        {/* Navigation Items */}
        <nav className="flex-1 py-6 ">
          <div className="space-y-1 px-3">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 min-w-max
                    ${isActive 
                      ? 'bg-[#2B6E44] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={item.description} // Tooltip when collapsed
                >
                  {/* Icon */}
                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    {item.icon}
                  </span>
                  
                  {/* Label (hidden when collapsed) */}
                  <span className=" hidden group-hover:block transition-opacity duration-200 whitespace-nowrap font-medium">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
       
      </div>
    </aside>
  );
}

// Navigation Icons
function HomeIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}