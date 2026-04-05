'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
export default function RetailerSidebar() {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Home',
      href: '/retailer',
      icon: <HomeIcon />,
      description: 'Dashboard overview',
    },
    {
        name: 'Catalog',
        href: 'retailer/market',
        icon: <CatalogIcon/>,
        description: 'market',
    }
  ];

  return(
    <aside className="fixed left-0 top-[3.7rem] h-screen w-[72px] hover:w-[240px] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out group z-40 overflow-hidden">
      <div className="flex flex-col h-full">
        
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
                  title={item.description} 
                >
                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    {item.icon}
                  </span>
                  
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

  function HomeIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
    }

    function CatalogIcon(){
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 2048 2048">
            <path fill="currentColor" d="M128 1792q0 27 10 50t27 40t41 28t50 10h640l257 128H256q-53 0-99-20t-82-55t-55-81t-20-100V256q0-49 21-95t57-82t82-57t96-22h1408v681l-128-64V128H256q-23 0-46 11t-41 30t-29 41t-12 46v1316q29-17 61-26t67-10h512v128H256q-27 0-50 10t-40 27t-28 41t-10 50zm1920-777v762l-576 287l-576-287v-762l576-287l576 287zm-576-144l-369 184l369 184l369-184l-369-184zm-448 827l384 191v-539l-384-192v540zm896 0v-540l-384 192v539l384-191z"/>
            </svg>
        );
    }
}