# Configuración de Supabase Storage

Este documento explica cómo configurar los buckets de almacenamiento en Supabase para las imágenes de portadas de libros y fotos de autores.

## 📦 Crear los Buckets

### 1. Acceder a Storage en Supabase

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Navega a **Storage** en el menú lateral

### 2. Crear el bucket "portadas"

1. Haz click en **"New bucket"** o **"Crear bucket"**
2. Configuración:
   - **Name**: `portadas`
   - **Public bucket**: ✅ **Marcado** (debe ser público para que las imágenes sean accesibles)
   - **File size limit**: 5 MB (o el tamaño que prefieras)
   - **Allowed MIME types**: `image/*` (opcional, para restringir solo imágenes)

3. Haz click en **"Create bucket"**

### 3. Crear el bucket "authors"

1. Haz click en **"New bucket"** o **"Crear bucket"**
2. Configuración:
   - **Name**: `authors`
   - **Public bucket**: ✅ **Marcado** (debe ser público para que las imágenes sean accesibles)
   - **File size limit**: 5 MB (o el tamaño que prefieras)
   - **Allowed MIME types**: `image/*` (opcional, para restringir solo imágenes)

3. Haz click en **"Create bucket"**

## 🔒 Configurar Políticas de Seguridad (RLS)

### Para el bucket "portadas"

1. Ve al bucket `portadas`
2. Click en **"Policies"** o **"Políticas"**
3. Crea las siguientes políticas:

#### Política 1: Permitir lectura pública
```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portadas' );
```

#### Política 2: Permitir inserción para usuarios autenticados
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'portadas' AND auth.role() = 'authenticated' );
```

#### Política 3: Permitir actualización para usuarios autenticados
```sql
-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'portadas' AND auth.role() = 'authenticated' );
```

#### Política 4: Permitir eliminación para usuarios autenticados
```sql
-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'portadas' AND auth.role() = 'authenticated' );
```

### Para el bucket "authors"

Repite las mismas políticas pero cambiando `bucket_id = 'portadas'` por `bucket_id = 'authors'`

## 🛠️ Alternativa: Usar el SQL Editor

Puedes ejecutar todas las políticas a la vez desde el **SQL Editor**:

```sql
-- Políticas para el bucket 'portadas'
CREATE POLICY "Public Access - Portadas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portadas' );

CREATE POLICY "Authenticated Upload - Portadas"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'portadas' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Update - Portadas"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'portadas' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete - Portadas"
ON storage.objects FOR DELETE
USING ( bucket_id = 'portadas' AND auth.role() = 'authenticated' );

-- Políticas para el bucket 'authors'
CREATE POLICY "Public Access - Authors"
ON storage.objects FOR SELECT
USING ( bucket_id = 'authors' );

CREATE POLICY "Authenticated Upload - Authors"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'authors' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Update - Authors"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'authors' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete - Authors"
ON storage.objects FOR DELETE
USING ( bucket_id = 'authors' AND auth.role() = 'authenticated' );
```

## ⚠️ Notas Importantes

1. **Buckets públicos**: Los buckets deben ser públicos para que las URLs generadas sean accesibles sin autenticación
2. **Límites de tamaño**: Asegúrate de configurar límites razonables (5MB es suficiente para imágenes)
3. **RLS**: Las políticas RLS (Row Level Security) controlan quién puede leer, escribir y eliminar archivos
4. **Admin**: El usuario admin (`jorgealejandrocasaresdelgado@gmail.com`) necesita estar autenticado para subir archivos

## ✅ Verificación

Después de configurar, verifica que:

1. Los buckets `portadas` y `authors` existen y son públicos
2. Las políticas RLS están activas
3. Puedes subir imágenes desde la interfaz de administración
4. Las URLs públicas de las imágenes se generan correctamente

## 🐛 Solución de Problemas

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS están creadas correctamente
- Asegúrate de que el usuario está autenticado
- Verifica que el bucket es público

### Error: "Bucket not found"
- Verifica que los nombres de los buckets son exactamente `portadas` y `authors`
- Los nombres son case-sensitive

### Las imágenes no se muestran
- Verifica que el bucket es público
- Revisa que la URL pública se genera correctamente
- Verifica los permisos de lectura en las políticas RLS

