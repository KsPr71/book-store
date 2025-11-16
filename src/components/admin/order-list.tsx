"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsAdmin } from '@/lib/supabase/admin';
import Image from 'next/image';
import type { OrderWithDetails, OrderStatus, OrderItemWithBook } from '@/types/database';
import { shouldOptimizeImage } from '@/lib/utils';

export function OrderList() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user && checkIsAdmin(user.email || '')) {
      loadOrders();
    }
  }, [user, statusFilter]);

  const loadOrders = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const url = statusFilter === 'all' 
        ? '/api/admin/orders'
        : `/api/admin/orders?status=${statusFilter}`;

      const response = await fetch(url, {
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

      const response = await fetch(`/api/admin/orders?order_id=${orderId}`, {
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

  const updateOrderStatus = async (orderId: string, status: OrderStatus, adminNotes?: string) => {
    setUpdating(orderId);
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          status,
          admin_notes: adminNotes,
        }),
      });

      if (response.ok) {
        await loadOrders();
        if (selectedOrder?.order_id === orderId) {
          await loadOrderDetails(orderId);
        }
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el pedido');
    } finally {
      setUpdating(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
          }`}
        >
          Todos
        </button>
        {(['pending', 'processing', 'completed', 'cancelled', 'refunded'] as OrderStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {getStatusText(status)}
          </button>
        ))}
      </div>

      {selectedOrder ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← Volver a la lista
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Usuario ID: {selectedOrder.user_id}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                {getStatusText(selectedOrder.status)}
              </span>
            </div>

            {/* Cambiar estado */}
            <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                Cambiar estado
              </h3>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'processing', 'completed', 'cancelled', 'refunded'] as OrderStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(selectedOrder.order_id, status)}
                    disabled={updating === selectedOrder.order_id || selectedOrder.status === status}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      selectedOrder.status === status
                        ? 'bg-blue-500 text-white cursor-not-allowed'
                        : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                    } disabled:opacity-50`}
                  >
                    {getStatusText(status)}
                  </button>
                ))}
              </div>
            </div>

            {/* Items del pedido */}
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

            {/* Total */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Total:
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Información del cliente */}
            {selectedOrder.customer_name && (
              <div className="mb-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Información del cliente
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

            {/* Notas */}
            {selectedOrder.notes && (
              <div className="mb-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  Notas del cliente
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Notas del administrador */}
            <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                Notas del administrador
              </h3>
              <textarea
                value={selectedOrder.admin_notes || ''}
                onChange={async (e) => {
                  const newNotes = e.target.value;
                  await updateOrderStatus(selectedOrder.order_id, selectedOrder.status, newNotes);
                }}
                placeholder="Agregar notas internas..."
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                No hay pedidos {statusFilter !== 'all' ? `con estado "${getStatusText(statusFilter)}"` : ''}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => loadOrderDetails(order.order_id)}
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
                      {order.customer_name && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          Cliente: {order.customer_name}
                        </p>
                      )}
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
  );
}

