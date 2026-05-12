import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import FarmerSidebar from './FarmerSidebar';
import NavBar from '@/app/components/NavBar';


export default async function FarmerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth');
  }

  if (session.role !== 'FARMER') {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <FarmerSidebar />

      {/* Main Content Area */}
      <div className="ml-[72px] transition-all duration-300">
        {/* Your existing top navbar goes here if you have one */}
        {/* <TopNavbar /> */}
        
        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}