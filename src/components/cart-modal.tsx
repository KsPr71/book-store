"use client";

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CountryPhoneSelector, formatFullPhoneNumber, parsePhoneNumber } from '@/components/ui/country-phone-selector';
import { openOrderWhatsApp } from '@/lib/utils/whatsapp';
import type { CheckoutData } from '@/types/database';
import { shouldOptimizeImage } from '@/lib/utils';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, loading, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+53');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    customer_name: '',
    customer_email: user?.email || '',
    customer_phone: '',
    shipping_address: '',
    notes: '',
  });
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Cargar perfil del usuario cuando se muestra el formulario de checkout
  React.useEffect(() => {
    const loadUserProfile = async () => {
      if (showCheckoutForm && user) {
        setLoadingProfile(true);
        try {
          const { supabase } = await import('@/lib/supabase/client');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) return;

          const response = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const profile = data.profile;
            
            // Construir nombre completo desde el perfil o user_metadata
            let fullName = '';
            if (profile?.first_name || profile?.last_name) {
              fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            } else if (user.user_metadata?.first_name || user.user_metadata?.last_name) {
              fullName = `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim();
            }
            
            // Parsear número de teléfono si existe
            let parsedPhone = { countryCode: '+53', phoneNumber: '' };
            if (profile?.phone_number) {
              parsedPhone = parsePhoneNumber(profile.phone_number);
            }
            
            setPhoneCountryCode(parsedPhone.countryCode);
            setPhoneNumber(parsedPhone.phoneNumber);
            
            setCheckoutData(prev => ({
              ...prev,
              customer_name: fullName || prev.customer_name,
              customer_email: user.email || prev.customer_email,
              customer_phone: profile?.phone_number || prev.customer_phone,
            }));
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          // Si falla, usar datos básicos del usuario
          setCheckoutData(prev => ({
            ...prev,
            customer_email: user.email || prev.customer_email,
          }));
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    loadUserProfile();
  }, [showCheckoutForm, user]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      return;
    }

    setShowCheckoutForm(true);
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!checkoutData.customer_name || !checkoutData.customer_email) {
      setCheckoutError('Nombre y email son requeridos');
      return;
    }

    // Formatear número de teléfono completo con código de país
    const fullPhoneNumber = phoneNumber 
      ? formatFullPhoneNumber(phoneCountryCode, phoneNumber)
      : checkoutData.customer_phone;

    setIsCheckingOut(true);

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sesión no válida');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          checkoutData: {
            ...checkoutData,
            customer_phone: fullPhoneNumber,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al procesar el pedido');
      }

      const data = await response.json();
      
      // Generar y abrir WhatsApp con los detalles del pedido
      // Hacer esto antes de limpiar el carrito para tener acceso a los items
      const orderItems = items.map(item => {
        const mainAuthor = item.book.authors?.find(author => author.role === 'main_author');
        return {
          title: item.book.title,
          author: mainAuthor?.full_name,
          quantity: item.quantity,
          unitPrice: item.book.price,
          subtotal: item.quantity * item.book.price,
        };
      });
      
      openOrderWhatsApp({
        orderNumber: data.order.order_number,
        customerName: checkoutData.customer_name,
        customerEmail: checkoutData.customer_email,
        customerPhone: fullPhoneNumber || undefined,
        items: orderItems,
        totalAmount: data.order.total_amount,
        shippingAddress: checkoutData.shipping_address || undefined,
        notes: checkoutData.notes || undefined,
      });
      
      // Limpiar el carrito
      await clearCart();
      
      // Cerrar modal
      onClose();
      
      // Redirigir a la página de pedidos o mostrar mensaje de éxito
      router.push(`/orders?order_id=${data.order.order_id}`);
    } catch (error) {
      console.error('Error during checkout:', error);
      setCheckoutError(error instanceof Error ? error.message : 'Error al procesar el pedido');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {showCheckoutForm ? 'Finalizar Pedido' : 'Carrito de Compras'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showCheckoutForm ? (
            <form onSubmit={handleSubmitCheckout} className="space-y-4">
              {checkoutError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 text-sm">{checkoutError}</p>
                </div>
              )}

              {loadingProfile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">Cargando datos del perfil...</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={checkoutData.customer_name}
                  onChange={(e) => setCheckoutData({ ...checkoutData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingProfile}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={checkoutData.customer_email}
                  onChange={(e) => setCheckoutData({ ...checkoutData, customer_email: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingProfile}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Teléfono
                </label>
                <CountryPhoneSelector
                  countryCode={phoneCountryCode}
                  phoneNumber={phoneNumber}
                  onCountryCodeChange={setPhoneCountryCode}
                  onPhoneNumberChange={setPhoneNumber}
                  disabled={loadingProfile}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Solicitar por WhatsApp
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={checkoutData.shipping_address === 'whatsapp'}
                    onChange={(e) => setCheckoutData({ 
                      ...checkoutData, 
                      shipping_address: e.target.checked ? 'whatsapp' : '' 
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loadingProfile}
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Deseo recibir información de mi pedido por WhatsApp
                  </span>
                </div>
                {checkoutData.shipping_address === 'whatsapp' && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Te contactaremos por WhatsApp al número proporcionado para coordinar la entrega de tu pedido.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Notas adicionales
                </label>
                <textarea
                  value={checkoutData.notes}
                  onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">Total:</span>
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isCheckingOut}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCheckingOut ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-neutral-600 dark:text-neutral-400">Cargando carrito...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-neutral-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-2">Tu carrito está vacío</p>
                  <button
                    onClick={onClose}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.cart_id}
                      className="flex gap-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                    >
                      <div className="relative w-20 h-28 flex-shrink-0 rounded overflow-hidden">
                        {item.book.cover_image_url ? (
                          <Image
                            src={item.book.cover_image_url}
                            alt={item.book.title}
                            fill
                            className="object-cover"
                            unoptimized={!shouldOptimizeImage(item.book.cover_image_url)}
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                            <span className="text-xs text-neutral-400">Sin imagen</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                          {item.book.title}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          ${item.book.price.toFixed(2)} c/u
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.book_id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-neutral-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.book_id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.book_id)}
                            className="text-red-500 hover:text-red-600 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-2">
                          Subtotal: ${(item.book.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showCheckoutForm && items.length > 0 && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">Total:</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              Proceder al Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

