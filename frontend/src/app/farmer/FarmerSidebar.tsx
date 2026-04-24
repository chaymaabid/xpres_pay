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
      name:'Active Escrows',
      href:'/farmer/escrow',
      icon: <LockedIcon/>,
      description:' browse locked orders',
    },
     {
      name:'Orders',
      href:'/farmer/orders',
      icon: <OrdersIcon/>,
      description:' browse orders',
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
function LockedIcon(){
  return(
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect x="5.73685" y="12.0526" width="12.5263" height="8.94737" rx="2" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></rect> <path d="M7.52631 12.0526V8.47368C7.52631 6.00294 9.52924 4 12 4C14.4707 4 16.4737 6.00294 16.4737 8.47368V12.0526" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
  );
}
function OrdersIcon(){
      return(
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
        <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5285 6C16.5098 5.9193 16.4904 5.83842 16.4701 5.75746C16.2061 4.70138 15.7904 3.55383 15.1125 2.65C14.4135 1.71802 13.3929 1 12 1C10.6071 1 9.58648 1.71802 8.88749 2.65C8.20962 3.55383 7.79387 4.70138 7.52985 5.75747C7.50961 5.83842 7.49016 5.9193 7.47145 6H5.8711C4.29171 6 2.98281 7.22455 2.87775 8.80044L2.14441 19.8004C2.02898 21.532 3.40238 23 5.13777 23H18.8622C20.5976 23 21.971 21.532 21.8556 19.8004L21.1222 8.80044C21.0172 7.22455 19.7083 6 18.1289 6H16.5285ZM8 11C8.57298 11 8.99806 10.5684 9.00001 9.99817C9.00016 9.97438 9.00044 9.9506 9.00084 9.92682C9.00172 9.87413 9.00351 9.79455 9.00718 9.69194C9.01451 9.48652 9.0293 9.18999 9.05905 8.83304C9.08015 8.57976 9.10858 8.29862 9.14674 8H14.8533C14.8914 8.29862 14.9198 8.57976 14.941 8.83305C14.9707 9.18999 14.9855 9.48652 14.9928 9.69194C14.9965 9.79455 14.9983 9.87413 14.9992 9.92682C14.9996 9.95134 14.9999 9.97587 15 10.0004C15 10.0004 15 11 16 11C17 11 17 9.99866 17 9.99866C16.9999 9.9636 16.9995 9.92854 16.9989 9.89349C16.9978 9.829 16.9957 9.7367 16.9915 9.62056C16.9833 9.38848 16.9668 9.06001 16.934 8.66695C16.917 8.46202 16.8953 8.23812 16.8679 8H18.1289C18.6554 8 19.0917 8.40818 19.1267 8.93348L19.86 19.9335C19.8985 20.5107 19.4407 21 18.8622 21H5.13777C4.55931 21 4.10151 20.5107 4.13998 19.9335L4.87332 8.93348C4.90834 8.40818 5.34464 8 5.8711 8H7.13208C7.10465 8.23812 7.08303 8.46202 7.06595 8.66696C7.0332 9.06001 7.01674 9.38848 7.00845 9.62056C7.0043 9.7367 7.00219 9.829 7.00112 9.89349C7.00054 9.92785 7.00011 9.96221 7 9.99658C6.99924 10.5672 7.42833 11 8 11ZM9.53352 6H14.4665C14.2353 5.15322 13.921 4.39466 13.5125 3.85C13.0865 3.28198 12.6071 3 12 3C11.3929 3 10.9135 3.28198 10.4875 3.85C10.079 4.39466 9.76472 5.15322 9.53352 6Z" fill="#0F0F0F">
        </path> </g></svg>
      );
    }