// Número de WhatsApp del admin (cambia este número por el número real del admin)
// Formato: código de país + número (ejemplo: 521234567890 para México: +52 12 3456 7890)
const ADMIN_WHATSAPP_NUMBER = '5352708602'; // +53 52708602

export interface WhatsAppMessageConfig {
  title: string;
  author?: string;
  price?: number;
}

export interface OrderWhatsAppConfig {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    title: string;
    author?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totalAmount: number;
  shippingAddress?: string;
  notes?: string;
}

export function createWhatsAppUrl(config: WhatsAppMessageConfig): {url: string, onClick: (e: React.MouseEvent) => void} {
  const { title, author, price } = config;
  
  // Crear mensaje de WhatsApp dirigido al admin
  const message = encodeURIComponent(
    `¡Hola! 👋\n\nMe interesa solicitar el siguiente libro:\n\n📚 *${title}*${
      author ? `\n👤 Autor: ${author}` : ''
    }${price ? `\n💰 Precio: $${price.toFixed(2)}` : ''}\n\n¿Podrías ayudarme con más información?`
  );
  
  // URL de WhatsApp con el número del admin y mensaje prellenado
  const url = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${message}`;
  
  // Manejador del click que previene la propagación
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que el click se propague
    e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
    // Abrir WhatsApp en una nueva ventana
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return { url, onClick };
}

/**
 * Genera un mensaje de WhatsApp para un pedido completo desde el cliente
 */
export function createOrderWhatsAppMessage(config: OrderWhatsAppConfig): string {
  const lines: string[] = [];
  
  lines.push('¡Hola! 👋\n\nMe interesa realizar el siguiente pedido:\n');
  lines.push(`🆔 *Pedido:* ${config.orderNumber}`);
  lines.push('');
  lines.push('👤 *Mis datos:*');
  lines.push(`   Nombre: ${config.customerName}`);
  if (config.customerEmail) {
    lines.push(`   Email: ${config.customerEmail}`);
  }
  if (config.customerPhone) {
    lines.push(`   Teléfono: ${config.customerPhone}`);
  }
  lines.push('');
  
  if (config.items && config.items.length > 0) {
    lines.push('📚 *Libros solicitados:*');
    config.items.forEach((item, index) => {
      lines.push(`   ${index + 1}. ${item.title}`);
      if (item.author) {
        lines.push(`      Autor: ${item.author}`);
      }
      lines.push(`      Cantidad: ${item.quantity}`);
      lines.push(`      Precio unitario: $${item.unitPrice.toFixed(2)}`);
      lines.push(`      Subtotal: $${item.subtotal.toFixed(2)}`);
      lines.push('');
    });
  }
  
  lines.push(`💰 *Total:* $${config.totalAmount.toFixed(2)}`);
  lines.push('');
  
  if (config.shippingAddress) {
    if (config.shippingAddress === 'whatsapp') {
      lines.push('📱 *Solicito contacto por WhatsApp*');
    } else {
      lines.push(`📍 *Dirección de envío:* ${config.shippingAddress}`);
    }
    lines.push('');
  }
  
  if (config.notes) {
    lines.push(`📝 *Notas adicionales:*`);
    lines.push(`   ${config.notes}`);
    lines.push('');
  }
  
  lines.push('¿Podrías confirmarme el pedido y ayudarme con más información?');
  
  return lines.join('\n');
}

/**
 * Crea la URL de WhatsApp para un pedido completo y la abre automáticamente
 */
export function openOrderWhatsApp(config: OrderWhatsAppConfig): void {
  const message = createOrderWhatsAppMessage(config);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`;
  
  // Abrir WhatsApp en una nueva ventana
  window.open(url, '_blank', 'noopener,noreferrer');
}