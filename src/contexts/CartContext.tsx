"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { CartItemWithBook, BookWithRelations } from '@/types/database';

interface CartContextType {
  items: CartItemWithBook[];
  loading: boolean;
  addToCart: (book: BookWithRelations, quantity?: number) => Promise<void>;
  removeFromCart: (bookId: string) => Promise<void>;
  updateQuantity: (bookId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar carrito desde el servidor
  const loadCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setItems([]);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        console.error('Error loading cart:', await response.text());
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar carrito al montar y cuando el usuario cambia
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Agregar al carrito
  const addToCart = useCallback(async (book: BookWithRelations, quantity: number = 1) => {
    if (!user) {
      throw new Error('Debes iniciar sesión para agregar productos al carrito');
    }

    if (book.status !== 'available') {
      throw new Error('Este libro no está disponible');
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sesión no válida');
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          book_id: book.book_id,
          quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error || 'Error al agregar al carrito'}: ${error.details}`
          : error.error || 'Error al agregar al carrito';
        console.error('Error response:', error);
        throw new Error(errorMessage);
      }

      // Recargar el carrito
      await loadCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }, [user, loadCart]);

  // Remover del carrito
  const removeFromCart = useCallback(async (bookId: string) => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sesión no válida');
      }

      const response = await fetch(`/api/cart?book_id=${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al remover del carrito');
      }

      // Recargar el carrito
      await loadCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }, [user, loadCart]);

  // Actualizar cantidad
  const updateQuantity = useCallback(async (bookId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(bookId);
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sesión no válida');
      }

      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          book_id: bookId,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la cantidad');
      }

      // Recargar el carrito
      await loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  }, [user, loadCart, removeFromCart]);

  // Limpiar carrito
  const clearCart = useCallback(async () => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sesión no válida');
      }

      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al limpiar el carrito');
      }

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }, [user]);

  // Calcular total de items
  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  // Calcular precio total
  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + (item.book.price * item.quantity), 0);
  }, [items]);

  // Refrescar carrito manualmente
  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const value: CartContextType = {
    items,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

