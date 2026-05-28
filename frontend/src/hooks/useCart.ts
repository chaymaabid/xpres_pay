'use client';
import { useState, useEffect, useCallback } from 'react';

export type CartItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  farmerId: string;
  farmerName: string;
  imageId?: string;
  stockAvailable?: number;
};

export type FarmerGroup = {
  farmerId: string;
  farmerName: string;
  farmerRating?: number;
  items: CartItem[];
  total: number;
};

function cartKey(userId: string) {
  return `xprespay_cart_${userId}`;
}

function readCart(userId: string): CartItem[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(cartKey(userId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(userId: string, items: CartItem[]): void {
  if (!userId) return;
  localStorage.setItem(cartKey(userId), JSON.stringify(items));
}

export function useCart(userId: string) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    setItems([]);

    if (!userId) return; 

    setItems(readCart(userId));
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (!hydrated || !userId) return;
    writeCart(userId, items);
  }, [items, hydrated, userId]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems(prev => {
      if (qty <= 0) return prev.filter(i => i.productId !== productId);
      return prev.map(i =>
        i.productId === productId ? { ...i, quantity: qty } : i
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const clearFarmerCart = useCallback((farmerId: string) => {
    setItems(prev => prev.filter(i => i.farmerId !== farmerId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const groupedByFarmer: FarmerGroup[] = items.reduce<FarmerGroup[]>((acc, item) => {
    const group = acc.find(g => g.farmerId === item.farmerId);
    if (group) {
      group.items.push(item);
      group.total += item.price * item.quantity;
    } else {
      acc.push({
        farmerId: item.farmerId,
        farmerName: item.farmerName,
        items: [item],
        total: item.price * item.quantity,
      });
    }
    return acc;
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const grandTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return {
    items,
    hydrated,
    groupedByFarmer,
    totalItems,
    grandTotal,
    addItem,
    updateQty,
    removeItem,
    clearFarmerCart,
    clearCart,
  };
}