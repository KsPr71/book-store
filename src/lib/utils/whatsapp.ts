// Número de WhatsApp del admin (cambia este número por el número real del admin)
// Formato: código de país + número (ejemplo: 521234567890 para México: +52 12 3456 7890)
const ADMIN_WHATSAPP_NUMBER = '52708602'; // TODO: Reemplazar con el número real del admin

export interface WhatsAppMessageConfig {
  title: string;
  author?: string;
  price?: number;
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