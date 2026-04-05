import { authApi } from "@/lib/authApi";

export interface ProductImage {
  id: string;
  url: string;
  productId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: ProductImage[];
  stockAvailable: number;
}
export interface OwnerBasicInfo {
  id: string;
  email: string;
  name: string;
  trustScore: number;
}
export interface ProductMarket extends Product {
  owner: OwnerBasicInfo;
}
export interface UpdateProductDto {
  price?: number;
  description?: string;
  stockAvailable?: number;
}
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stockAvailable: number;
}

export const createProduct = async (
  dto: CreateProductDto,
  files: File[]
): Promise<Product> => {
  const formData = new FormData();
  formData.append('name', dto.name);
  formData.append('description', dto.description);
  formData.append('price', String(dto.price));
  formData.append('stockAvailable', String(dto.stockAvailable));
  files.forEach((file) => formData.append('images', file));

  const res = await authApi.post('/api/v1/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
// ── Read ────────────────────────────────────────────────────────────────────

export const getMyProducts = async (): Promise<Product[]> => {
  const res = await authApi.get("/api/v1/products/myproducts");
  return res.data;
};

export const getProducts=async(): Promise <ProductMarket[]>=>{
  const res=await authApi.get("/api/v1/products")
  return res.data;
}
// ── Update fields ───────────────────────────────────────────────────────────

export const updateProduct = async (
  productId: string,
  dto: UpdateProductDto
): Promise<Product> => {
  const res = await authApi.patch(`/api/v1/products/${productId}`, dto);
  return res.data;
};

// ── Image management ────────────────────────────────────────────────────────

export const deleteProductImage = async (
  productId: string,
  imageId: string
): Promise<void> => {
  await authApi.delete(`/api/v1/products/${productId}/images/${imageId}`);
};

export const addProductImage = async (
  productId: string,
  file: File
): Promise<ProductImage> => {
  const formData = new FormData();
  formData.append("image", file);
  const res = await authApi.post(
    `/api/v1/products/${productId}/images`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};