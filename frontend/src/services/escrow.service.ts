// services/escrow.service.ts
import { authApi } from '@/lib/authApi';

export type EscrowOrder = {
  id: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  buyer: { id: string; name: string; email: string };
  transaction: { id: string; status: string; orderAmount: number; createdAt: string };
  orderItems: {
    id: string;
    quantity: number;
    unitPriceAtOrder: number;
    product: { id: string; name: string; price: number };
  }[];
};

export const getFarmerEscrows = async (): Promise<EscrowOrder[]> => {
  const res = await authApi.get('/api/v1/orders/farmer-escrows');
  return res.data;
};

export const uploadProofOfDelivery = async (
  orderId: string,
  file: File,
): Promise<{ matched: boolean; confidence: number }> => {
  const form = new FormData();
  form.append('file', file);
  const res = await authApi.post(
    `/api/v1/transactions/${orderId}/proof-delivery`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
};

export const releaseFunds = async (
  orderId: string,
): Promise<{ success: boolean; amount: number; transferId: string }> => {
  const res = await authApi.post(`/api/v1/transactions/${orderId}/release`);
  return res.data;
};