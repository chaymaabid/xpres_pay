// app/dashboard/farmer/products/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getMyProducts, Product } from '@/services/product.service';
import ProductsClient from './ProductsClient';

export default async function MyProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.role !== 'FARMER') {
    redirect('/auth');
  }

  const products: Product[] = await getMyProducts();

  return <ProductsClient initialProducts={products} />;
}