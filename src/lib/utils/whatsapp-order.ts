import type { OrderWithDetails, OrderItemWithBook } from '@/types/database';

// Número de WhatsApp del admin
const ADMIN_WHATSAPP_NUMBER = '5352708602'; // +53 52708602

/**
 * Genera un mensaje de WhatsApp con los detalles de un pedido completado
 */
export function generateOrderWhatsAppMessage(order: OrderWithDetails): string {
  const lines: string[] = [];
  
  lines.push('📦 *NUEVO PEDIDO COMPLETADO*');
  lines.push('');
  lines.push(`🆔 *Pedido:* ${order.order_number}`);
  lines.push(`📅 *Fecha:* ${new Date(order.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`);
  lines.push('');
  lines.push('👤 *Cliente:*');
  lines.push(`   Nombre: ${order.customer_name || 'N/A'}`);
  if (order.customer_email) {
    lines.push(`   Email: ${order.customer_email}`);
  }
  if (order.customer_phone) {
    lines.push(`   Teléfono: ${order.customer_phone}`);
  }
  lines.push('');
  
  if (order.items && order.items.length > 0) {
    lines.push('📚 *Libros solicitados:*');
    order.items.forEach((item: OrderItemWithBook, index: number) => {
      lines.push(`   ${index + 1}. ${item.book.title}`);
      if (item.book.author) {
        lines.push(`      Autor: ${item.book.author}`);
      }
      lines.push(`      Cantidad: ${item.quantity}`);
      lines.push(`      Precio unitario: $${item.unit_price.toFixed(2)}`);
      lines.push(`      Subtotal: $${item.subtotal.toFixed(2)}`);
      lines.push('');
    });
  }
  
  lines.push(`💰 *Total:* $${order.total_amount.toFixed(2)}`);
  lines.push('');
  
  if (order.shipping_address) {
    if (order.shipping_address === 'whatsapp') {
      lines.push('📱 *Solicita contacto por WhatsApp*');
    } else {
      lines.push(`📍 *Dirección de envío:* ${order.shipping_address}`);
    }
    lines.push('');
  }
  
  if (order.notes) {
    lines.push(`📝 *Notas del cliente:*`);
    lines.push(`   ${order.notes}`);
    lines.push('');
  }
  
  if (order.admin_notes) {
    lines.push(`📋 *Notas administrativas:*`);
    lines.push(`   ${order.admin_notes}`);
    lines.push('');
  }
  
  lines.push('✅ *Estado:* Completado');
  
  return lines.join('\n');
}

/**
 * Genera la URL de WhatsApp con el mensaje del pedido
 */
export function getOrderWhatsAppUrl(order: OrderWithDetails): string {
  const message = generateOrderWhatsAppMessage(order);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Envía un mensaje de WhatsApp al admin sobre un pedido completado
 * 
 * Esta función intenta enviar el mensaje usando una API externa si está configurada.
 * Si no hay API configurada, genera y loguea la URL de WhatsApp con el mensaje prellenado.
 */
export async function sendOrderWhatsAppNotification(order: OrderWithDetails): Promise<void> {
  const message = generateOrderWhatsAppMessage(order);
  const whatsappUrl = getOrderWhatsAppUrl(order);
  
  // Intentar usar una API de WhatsApp si está configurada
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;
  
  if (whatsappApiUrl && whatsappApiToken) {
    try {
      // Intentar enviar usando la API configurada
      const response = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${whatsappApiToken}`,
        },
        body: JSON.stringify({
          to: `+${ADMIN_WHATSAPP_NUMBER}`,
          message: message,
        }),
      });
      
      if (response.ok) {
        console.log('✅ WhatsApp message sent successfully for order:', order.order_number);
        return;
      } else {
        console.error('❌ Failed to send WhatsApp message via API:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error calling WhatsApp API:', error);
    }
  }
  
  // Si no hay API configurada o falló, loguear la URL para uso manual
  console.log('📱 WhatsApp notification for order:', order.order_number);
  console.log('📋 Message:');
  console.log(message);
  console.log('🔗 WhatsApp URL (copy and open manually):');
  console.log(whatsappUrl);
  console.log('');
  console.log('💡 Tip: Para envío automático, configura WHATSAPP_API_URL y WHATSAPP_API_TOKEN en las variables de entorno');
}

