import { authApi } from "@/lib/authApi";

export type UserRole = 'FARMER' | 'RETAILER' | 'ADMIN';
export type EscrowState = 'INITIATED' | 'LOCKED' | 'DELIVERED' | 'RELEASED' | 'BLOCKED';
export type CreditOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  isEnabled: boolean; 
  trustProfile: {
    isVerified: boolean;
    trustScore: number;
  } | null;
  _count: {
    ordersAsBuyer: number;
    products: number;
    loansGiven: number;
    loansTaken: number;
  };
}

export interface AdminUsersResponse {
  data: AdminUserSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPriceAtOrder: number;
  product: { id: string; name: string };
}

export interface OrderTransaction {
  id: string;
  status: EscrowState;
  totalPaid: number;
  platformFee: number;
  amountToTransfer: number;
  paymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserOrder {
  id: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  note: string | null;
  createdAt: string;
  orderItems: OrderItem[];
  transaction: OrderTransaction | null;
}

export interface CreditOffer {
  id: string;
  amount: number;
  status: CreditOfferStatus;
  createdAt: string;
  respondedAt: string | null;
  note: string | null;
}

export interface Loan {
  id: string;
  totalCredit: number;
  totalUsed: number;
  createdAt: string;
  lender?: { id: string; name: string | null; email: string };
  borrower?: { id: string; name: string | null; email: string };
  creditOffers: CreditOffer[];
}

export interface TrustDevice {
  id: string;
  deviceFingerprint: string;
  deviceName: string | null;
  lastUsed: string;
}

export interface TrustProfile {
  id: string;
  trustScore: number;
  isVerified: boolean;
  idNumber: string | null;
  cinImg: string | null;
  faceImg: string | null;
  updatedAt: string;
  devices: TrustDevice[];
}

export interface AdminUserDetail extends AdminUserSummary {
  keycloakId: string;
  trustProfile: TrustProfile | null;
  isEnabled: boolean;
  ordersAsBuyer: AdminUserOrder[];
  products: {
    id: string;
    name: string;
    price: number;
    stockAvailable: number;
  }[];
  loansGiven: Loan[];
  loansTaken: Loan[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    totalEarning: number;
    totalProducts: number;
    totalDevices: number;
    totalCreditGiven: number;
    totalCreditTaken: number;
    loansGivenCount: number;
    loansTakenCount: number;
  };
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export const adminService = {
  async getUsers(params: GetUsersParams): Promise<AdminUsersResponse> {
    const qs = new URLSearchParams();

    if (params.page)   qs.set('page',   String(params.page));
    if (params.limit)  qs.set('limit',  String(params.limit));
    if (params.search) qs.set('search', params.search);
    if (params.role && params.role !== 'ALL') qs.set('role', params.role);

    const res = await authApi.get(`/api/v1/users?${qs.toString()}`);
    return res.data;
  },

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    const res = await authApi.get(`/api/v1/users/${userId}`);
    return res.data;
  },

  async setUserEnabled(
    userId: string,
    enabled: boolean,
  ): Promise<{ success: boolean; isEnabled: boolean }> {
    const res = await authApi.patch(`/api/v1/users/${userId}/enabled`, { enabled });
    return res.data;
  },
};