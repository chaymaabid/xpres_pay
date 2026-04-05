// context/CartContext.tsx
'use client';
import React, { createContext, useContext, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCart, CartItem, FarmerGroup } from '@/hooks/useCart';

type CartContextType = {
  items: CartItem[];
  groupedByFarmer: FarmerGroup[];
  totalItems: number;
  grandTotal: number;
  hydrated: boolean;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearFarmerCart: (farmerId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const userId = session?.user?.email ?? '';

  const cart = useCart(userId);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(prev => !prev);

  return (
    <CartContext.Provider value={{ ...cart, isOpen, openCart, closeCart, toggleCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used inside <CartProvider>');
  return ctx;
}