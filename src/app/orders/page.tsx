"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import type { OrderWithDetails, OrderItemWithBook } from '@/types/database';
import { shouldOptimizeImage } from '@/lib/utils';

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    loadOrders();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.order_id === orderId);
      if (order) {
        loadOrderDetails(order.order_id);
      }
    }
  }, [orderId, orders]);

  const loadOrders = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (orderId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/orders?order_id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.order);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'En proceso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">
          Mis Pedidos
        </h1>

        {selectedOrder ? (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedOrder(null);
                router.push('/orders');
              }}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              ← Volver a mis pedidos
            </button>

            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    Pedido {selectedOrder.order_number}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Fecha: {new Date(selectedOrder.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusText(selectedOrder.status)}
                </span>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Items del pedido
                  </h3>
                  {selectedOrder.items.map((item: OrderItemWithBook) => (
                    <div
                      key={item.order_item_id}
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
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">
                          {item.book.title}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                          Cantidad: {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          Subtotal: ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${selectedOrder.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedOrder.customer_name && (
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Información de contacto
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedOrder.customer_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p>
                    {selectedOrder.customer_phone && (
                      <p><span className="font-medium">Teléfono:</span> {selectedOrder.customer_phone}</p>
                    )}
                    {selectedOrder.shipping_address && (
                      <p><span className="font-medium">Dirección:</span> {selectedOrder.shipping_address}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    Notas
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-12 text-center">
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
                  No tienes pedidos aún
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Explorar libros
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.order_id}
                    className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(null);
                      loadOrderDetails(order.order_id);
                      router.push(`/orders?order_id=${order.order_id}`);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                          Pedido {order.order_number}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          {new Date(order.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {order.item_count || 0} item(s) • Total: ${order.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">Cargando...</p>
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}

