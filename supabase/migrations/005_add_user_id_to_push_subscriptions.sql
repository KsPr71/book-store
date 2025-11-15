-- Agregar columna user_id a push_subscriptions para asociar suscripciones con usuarios
ALTER TABLE push_subscriptions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Comentario
COMMENT ON COLUMN push_subscriptions.user_id IS 'ID del usuario propietario de la suscripción. NULL si es una suscripción anónima.';

