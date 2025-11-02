# Solución para Usuarios no Confirmados

Si tienes usuarios creados cuando la confirmación de email estaba activada, pero ahora has desactivado esa opción, estos usuarios aún pueden tener el estado "no confirmado". Aquí hay varias soluciones:

## Opción 1: Confirmar usuarios manualmente en Supabase Dashboard

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Navega a **Authentication** → **Users**
3. Encuentra el usuario que tiene el problema
4. Haz click en el usuario y busca la opción para confirmar su email manualmente
5. O simplemente haz click en el botón de "Confirm" o "Verify Email"

## Opción 2: Usar SQL para confirmar todos los usuarios

Ejecuta esta query en el **SQL Editor** de Supabase:

```sql
-- Confirmar todos los usuarios que no están confirmados
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

⚠️ **ADVERTENCIA**: Esto confirmará TODOS los usuarios no confirmados. Úsalo solo si estás seguro.

## Opción 3: Eliminar y recrear la cuenta

Si es un usuario de prueba o desarrollo:
1. Elimina el usuario desde Supabase Dashboard
2. Crea una nueva cuenta desde la aplicación
3. Como la confirmación está desactivada, debería funcionar inmediatamente

## Opción 4: Verificar configuración en Supabase

Asegúrate de que la confirmación de email esté realmente desactivada:

1. Ve a **Authentication** → **Settings**
2. Busca la opción **"Enable email confirmations"**
3. Asegúrate de que esté **desactivada**
4. Guarda los cambios

## Opción 5: Usar función para confirmar usuarios específicos

Si necesitas confirmar usuarios específicos por email, puedes crear una función en Supabase:

1. Ve a **Database** → **Functions**
2. Crea una nueva función SQL:

```sql
CREATE OR REPLACE FUNCTION confirm_user_email(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE email = user_email AND email_confirmed_at IS NULL;
END;
$$;
```

Luego puedes llamarla desde el SQL Editor:
```sql
SELECT confirm_user_email('usuario@ejemplo.com');
```

## Nota Importante

Después de confirmar usuarios manualmente o actualizar la configuración, los usuarios existentes deberían poder iniciar sesión normalmente. Los nuevos usuarios que se registren después de desactivar la confirmación no deberían tener este problema.

