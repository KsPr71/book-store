-- =====================================================
-- AGREGAR CAMPO DE TELÉFONO A LA TABLA PROFILES
-- =====================================================

-- Agregar columna phone_number a la tabla profiles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN phone_number VARCHAR(50);
        
        COMMENT ON COLUMN profiles.phone_number IS 'Número de teléfono del usuario para contacto y WhatsApp';
    END IF;
END $$;

