import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  console.log('**********************************************************')
  console.log(session?.user)
    console.log('**********************************************************')
  console.log(session?.user.role)
    console.log('**********************************************************')
  console.log(session?.expires)
  if (session?.role === 'FARMER')   redirect('/dashboard/farmer');
  if (session?.role === 'RETAILER') redirect('/dashboard/retailer');
  
  redirect('/auth');
}