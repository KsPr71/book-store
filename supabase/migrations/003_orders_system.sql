-- =====================================================
-- SISTEMA DE PEDIDOS Y CARRITO DE COMPRAS
-- =====================================================

-- =====================================================
-- TABLA: cart (Carrito de compras)
-- =====================================================
CREATE TABLE cart (
    cart_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id) -- Un usuario solo puede tener un item por libro en el carrito
);

-- =====================================================
-- TABLA: orders (Pedidos)
-- =====================================================
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Número de pedido único (ej: ORD-2024-001)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    shipping_address TEXT,
    notes TEXT, -- Notas del cliente
    admin_notes TEXT, -- Notas internas del administrador
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE, -- Fecha de completación
    cancelled_at TIMESTAMP WITH TIME ZONE -- Fecha de cancelación
);

-- =====================================================
-- TABLA: order_items (Items de pedido)
-- =====================================================
CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE RESTRICT, -- No permitir eliminar libros con pedidos
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0), -- Precio al momento de la compra
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0), -- quantity * unit_price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para cart
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_book_id ON cart(book_id);
CREATE INDEX idx_cart_user_book ON cart(user_id, book_id);

-- Índices para orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Índices para order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_book_id ON order_items(book_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para generar número de pedido único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix VARCHAR(4);
    sequence_num INTEGER;
    new_order_number VARCHAR(50);
BEGIN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Obtener el siguiente número de secuencia para el año actual
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_prefix || '-%';
    
    -- Formatear el número de pedido: ORD-YYYY-XXX
    new_order_number := 'ORD-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    NEW.order_number := new_order_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de pedido automáticamente
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- Trigger para actualizar updated_at en cart
CREATE TRIGGER update_cart_updated_at
    BEFORE UPDATE ON cart
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar completed_at cuando el status cambia a 'completed'
CREATE OR REPLACE FUNCTION update_order_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at := CURRENT_TIMESTAMP;
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at := NULL;
    END IF;
    
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at := CURRENT_TIMESTAMP;
    ELSIF NEW.status != 'cancelled' THEN
        NEW.cancelled_at := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar completed_at y cancelled_at
CREATE TRIGGER update_order_timestamps
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_completed_at();

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para cart
-- Los usuarios solo pueden ver y modificar su propio carrito
CREATE POLICY "Users can view their own cart"
    ON cart FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
    ON cart FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
    ON cart FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
    ON cart FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para orders
-- Los usuarios solo pueden ver sus propios pedidos
CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Los usuarios NO pueden modificar sus pedidos después de crearlos
-- Solo los administradores pueden modificar pedidos (se maneja en la API)

-- Políticas para order_items
-- Los usuarios solo pueden ver items de sus propios pedidos
CREATE POLICY "Users can view items of their own orders"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.order_id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Los usuarios NO pueden insertar, actualizar o eliminar items directamente
-- Esto se maneja a través de la creación de pedidos en la API

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para obtener pedidos con información del usuario y total de items
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
    o.order_id,
    o.order_number,
    o.user_id,
    o.status,
    o.total_amount,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.shipping_address,
    o.notes,
    o.admin_notes,
    o.created_at,
    o.updated_at,
    o.completed_at,
    o.cancelled_at,
    COUNT(oi.order_item_id) as item_count,
    SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;

-- Vista para obtener items de pedido con información del libro
CREATE OR REPLACE VIEW order_items_with_book AS
SELECT 
    oi.order_item_id,
    oi.order_id,
    oi.book_id,
    oi.quantity,
    oi.unit_price,
    oi.subtotal,
    oi.created_at,
    b.title as book_title,
    b.cover_image_url,
    b.isbn
FROM order_items oi
JOIN books b ON oi.book_id = b.book_id;

-- =====================================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- =====================================================

COMMENT ON TABLE cart IS 'Carrito de compras de los usuarios';
COMMENT ON TABLE orders IS 'Pedidos realizados por los usuarios';
COMMENT ON TABLE order_items IS 'Items individuales de cada pedido';

COMMENT ON COLUMN cart.quantity IS 'Cantidad del libro en el carrito';
COMMENT ON COLUMN orders.order_number IS 'Número único de pedido generado automáticamente (formato: ORD-YYYY-XXXXXX)';
COMMENT ON COLUMN orders.status IS 'Estado del pedido: pending, processing, completed, cancelled, refunded';
COMMENT ON COLUMN orders.total_amount IS 'Monto total del pedido';
COMMENT ON COLUMN orders.customer_name IS 'Nombre del cliente (puede diferir del perfil del usuario)';
COMMENT ON COLUMN orders.customer_email IS 'Email del cliente (puede diferir del email del usuario)';
COMMENT ON COLUMN orders.notes IS 'Notas del cliente sobre el pedido';
COMMENT ON COLUMN orders.admin_notes IS 'Notas internas del administrador';
COMMENT ON COLUMN order_items.unit_price IS 'Precio unitario del libro al momento de la compra (snapshot)';
COMMENT ON COLUMN order_items.subtotal IS 'Subtotal del item (quantity * unit_price)';

