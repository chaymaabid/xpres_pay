import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';


export default async function AdminHome() {
  const session = await getServerSession(authOptions);

  if (!session || session.role !== 'ADMIN') {
    redirect('/auth');
  }


  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 mt-16">
        <p className="text-gray-600 mt-1">
          Good morning, {session.user?.email?.split('@')[0]}.
        </p>
      </div>
    </div>
  );
}