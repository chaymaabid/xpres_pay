import { authApi } from '@/lib/authApi';

export type CreditStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type Credit = {
  id:          string;
  amount:      number;
  status:      CreditStatus;
  note?:       string;
  createdAt:   string;
  respondedAt: string | null;
  paymentIntentId: string | null;
  borrower?: { id: string; name: string; email: string; trustProfile?: { score: number } };
  lender?:   { id: string; name: string; email: string };
};
export type FarmerCard = {
  id:               string;
  name:             string;
  email:            string;
  score:            number;
  totalSales:        number;
  orderCount:       number;
  hasStripeAccount: boolean;
};
export type SavedCard = {
  id: string; brand: string; last4: string;
  expMonth: number; expYear: number;
} | null;
export type RetailerStats = {
  totalReserved:  number;
  acceptanceRate: number;
  activeFarmers:  number;
  avgScore:       number;
};

export type FarmerCredit = {
  id:          string;
  amount:      number;
  status:      'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  note?:       string;
  createdAt:   string;
  respondedAt: string | null;
  lender: { id: string; name: string; email: string };
};
 
export type FarmerCreditStats = {
  totalOffered:   number;  // sum of all offers ever received
  totalPending:   number;  // sum of PENDING offers
  totalAccepted:  number;  // sum of ACCEPTED
  totalRejected:  number;  // sum of REJECTED
};
export const createSetupIntent = async (): Promise<{ clientSecret: string }> => {
  const res = await authApi.post('/api/v1/credits/setup-intent');
  return res.data;
};

export const getSavedCard = async (): Promise<{ paymentMethod: SavedCard }> => {
  const res = await authApi.get('/api/v1/credits/payment-method');
  return res.data;
};

export const createCredit = async (data: {
  borrowerId: string;
  amount: number;
  note?: string;
}): Promise<Credit> => {
  const res = await authApi.post('/api/v1/credits', data);
  return res.data;
};

export const cancelCredit = async (creditId: string) => {
  const res = await authApi.post(`/api/v1/credits/${creditId}/cancel`);
  return res.data;
};

export const getMyOffers = async (): Promise<{
  credits: Credit[];
  stats: RetailerStats;
}> => {
  const res = await authApi.get('/api/v1/credits/my-offers');
  return res.data;
};

export const getMarketplace = async (): Promise<FarmerCard[]> => {
  const res = await authApi.get('/api/v1/credits/marketplace');
  return res.data;
};
export const getFarmerCredits = async (): Promise<{
  credits: FarmerCredit[];
  stats: FarmerCreditStats;
}> => {
  const res = await authApi.get('/api/v1/credits/farmer/all');
  return res.data;
};

export const acceptCredit = async (creditId: string) => {
  const res = await authApi.post(`/api/v1/credits/${creditId}/accept`);
  return res.data;
};

export const rejectCredit = async (creditId: string) => {
  const res = await authApi.post(`/api/v1/credits/${creditId}/reject`);
  return res.data;
};