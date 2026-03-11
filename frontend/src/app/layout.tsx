import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { TrustProvider } from '@/context/TrustContext';
import SecurityModal from './components/SecurityModal';
import './globals.css';
import dynamic from 'next/dynamic';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Xprespay — Agri-Fintech',
  description: 'The high-integrity platform for secure agricultural trade',
};

const NavBar = dynamic(() => import('@/app/components/NavBar'), { ssr: false });
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        
        <Providers>
          <TrustProvider>
          <NavBar/>
          {children}
          <SecurityModal/>
          </TrustProvider>
        </Providers>
      </body>
    </html>
  );
}