import { authApi } from "@/lib/authApi";

export type EscrowState = 'INITIATED' | 'LOCKED' | 'DELIVERED' | 'RELEASED' ;
export type CheckoutItem = {
  productId: string;
  productName: string;
  category?: string;
  price: number;        // unit price
  quantity: number;
  imageId?: string;
  stockAvailable?: number;
};
 
export type CheckoutGroup = {
  farmerId: string;
  farmerName: string;
  items: CheckoutItem[];
};
 
export type ShippingData = {
  fullName: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  deliveryNote: string;
};
export interface OrderListItem {
  id: string;
  totalAmount: string;
  createdAt: string;
  buyer: { id: string; name: string; email: string };
  orderItems: {
    product: {
      id: string;
      name: string;
      owner: { id: string; name: string };
    };
  }[];
  transaction: {
    status: EscrowState;
    orderAmount: string;
    totalPaid:string;
    proofOfDelivery:string | null;
  } | null;
}
export interface OrderDetail {
  id: string;
  totalAmount: string;
  status: string;
  shippingAddress: string;
  note?: string;
  createdAt: string;
  buyer: { id: string; name: string; email: string };
  orderItems: {
    id: string;
    quantity: number;
    unitPriceAtOrder: string;
    product: {
      id: string;
      name: string;
      description: string;
      images: { id: string }[];
      owner: { id: string; name: string };
    };
  }[];
  transaction: {
    id: string;
    amount: string;
    status: EscrowState;
    proofOfDelivery:string;
    ledgerEntries: {
      id: string;
      amount: string;
      previousStatus: EscrowState;
      currentStatus: EscrowState;
      timestamp: string;
      actorId: string;
    }[];
  } | null;
}
export interface OrdersResponse {
  data: OrderListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// What the backend returns from POST /orders
export type CreateOrderResponse = {
  orderId: string;
  clientSecret: string;   // Stripe PaymentIntent client secret
};
 
// Computed totals helper
export function computeTotals(items: CheckoutItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = +(subtotal * 0.05).toFixed(2); //5% fees 
  const shipping = 0;                                      // FREE
  const total = subtotal + tax + shipping;
  return { subtotal, tax, shipping, total };
}

// api calls

export const createOrder = async (
  items: CheckoutItem[],
  shipping: ShippingData,
  total:number,
): Promise<CreateOrderResponse> => {
  const res = await authApi.post("/api/v1/orders", {
    items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    status: "pending_payment",
    shippingAddress: `${shipping.streetAddress}, ${shipping.city}, ${shipping.zipCode}`,
    note: shipping.deliveryNote,
    total:computeTotals(items).total,
  });
  return res.data; 
};
export const orderService = {
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<OrdersResponse> {
    const { data } = await authApi.get('/api/v1/orders', { params });
    return data;
  },
 
  async getOrder(id: string): Promise<OrderDetail> {
    const { data } = await authApi.get(`/api/v1/orders/${id}`);
    return data;
  },
};