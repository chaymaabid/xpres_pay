import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function RetailerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session)                      redirect('/auth');
  if (session.role !== 'RETAILER')   redirect('/auth');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900">Retailer Dashboard</h1>
      <p className="text-gray-500 mt-1">Welcome, {session.user.email}</p>
      <p className="mt-8 text-sm text-gray-400">🚧 Coming next...</p>
    </div>
  );
}