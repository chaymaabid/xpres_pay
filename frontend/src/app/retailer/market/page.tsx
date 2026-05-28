import { getProducts, ProductMarket } from "@/services/product.service";
import ProductCard  from '@/app/retailer/market/componenets/ProductCard'; 
export default async function MarketPage() {
    const marketProducts: ProductMarket[]=await getProducts();
    return(

        <div className="p-8">
            <div className="flex items-center justify-between mb-8 mt-16">
            <div>
            <h1 className="text-3xl font-bold text-gray-900">Direct from Farmers to Your Business</h1>
            <p className="text-gray-500 mt-1 text-sm">Discover high-quality produce sourced directly from verified farmers ready for purchase</p>
            </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {marketProducts.length === 0 ? (
                      <EmptyState />
                    ) : (
                      marketProducts.map((product) => (
                        <ProductCard key={product.id} product={product}  />
                      ))
                    )}
            </div>
        
        </div>
    );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-5">
       No Products available for now
      </p>
    </div>
  );
    
}