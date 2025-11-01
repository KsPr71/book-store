# Base de Datos Supabase - Catálogo de Libros Electrónicos

Este directorio contiene las migraciones SQL para crear el esquema de base de datos del catálogo de libros electrónicos en Supabase.

## Estructura de la Base de Datos

### Tablas Principales

1. **publishers** - Editores/publicadores de libros
   - `publisher_id` (PK, UUID)
   - `name`, `description`, `website_url`, `logo_url`
   - `created_at`, `updated_at`

2. **authors** - Autores de libros
   - `author_id` (PK, UUID)
   - `full_name`, `biography`, `photo_url`
   - `birth_date`, `nationality`, `website`
   - `created_at`, `updated_at`

3. **categories** - Géneros/categorías de libros (con soporte para subcategorías)
   - `category_id` (PK, UUID)
   - `category_name`, `description`
   - `parent_category_id` (FK a sí misma)
   - `created_at`, `updated_at`

4. **books** - Libros electrónicos
   - `book_id` (PK, UUID)
   - `isbn`, `title`, `subtitle`, `description`
   - `publication_date`, `publisher_id` (FK a publishers)
   - `language`, `page_count`
   - `file_size` (MB), `file_format` (PDF, EPUB, MOBI, etc.)
   - `cover_image_url` (URL de la imagen de portada), `sample_url`, `full_content_url`
   - `price`, `is_featured`, `status` (available, draft, out_of_stock)
   - `created_at`, `updated_at`

### Tablas de Relación

5. **book_authors** - Relación muchos-a-muchos entre libros y autores
   - `book_id` (FK a books)
   - `author_id` (FK a authors)
   - `role` (main_author, coauthor, editor)
   - `created_at`

6. **book_categories** - Relación muchos-a-muchos entre libros y categorías
   - `book_id` (FK a books)
   - `category_id` (FK a categories)
   - `created_at`

## Cómo Aplicar las Migraciones en Supabase

### Opción 1: Desde el Dashboard de Supabase

1. Inicia sesión en tu proyecto de Supabase
2. Ve a la sección **SQL Editor**
3. Abre el archivo `supabase/migrations/001_initial_schema.sql`
4. Copia y pega todo el contenido en el editor SQL
5. Haz clic en **Run** para ejecutar la migración

### Opción 2: Usando Supabase CLI (Recomendado)

1. Instala Supabase CLI si no lo has hecho:
   ```bash
   npm install -g supabase
   ```

2. Inicia sesión en Supabase:
   ```bash
   supabase login
   ```

3. Enlaza tu proyecto local con Supabase:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Aplica las migraciones:
   ```bash
   supabase db push
   ```

### Opción 3: Migración Manual por Secciones

Si prefieres aplicar las migraciones paso a paso, puedes ejecutar cada sección por separado en el SQL Editor de Supabase:

1. Primero crea las tablas principales: `publishers`, `authors`, `categories`
2. Luego crea la tabla `books`
3. Finalmente crea las tablas de relación: `book_authors`, `book_categories`
4. Por último, ejecuta la sección de índices y triggers

## Características Incluidas

- ✅ Claves primarias UUID auto-generadas
- ✅ Relaciones de claves foráneas con acciones ON DELETE apropiadas
- ✅ Índices para optimizar consultas frecuentes
- ✅ Triggers automáticos para actualizar `updated_at`
- ✅ Constraints de validación (CHECK) para campos como `status` y `role`
- ✅ Soporte para subcategorías jerárquicas en `categories`
- ✅ Campos opcionales marcados correctamente (NULL permitido)

## Notas Importantes

- El campo `file_size` está en MB (NUMERIC con 2 decimales)
- El campo `status` en `books` solo acepta: `available`, `draft`, `out_of_stock`
- El campo `role` en `book_authors` solo acepta: `main_author`, `coauthor`, `editor`
- La tabla `categories` soporta jerarquías mediante `parent_category_id`
- Todos los timestamps incluyen timezone (`TIMESTAMP WITH TIME ZONE`)

## Configuración de Variables de Entorno

Para conectar tu aplicación Next.js con Supabase, necesitas configurar las siguientes variables de entorno:

### 1. Obtener las Claves de Supabase

1. Ve al dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **API** (o **Configuración** → **API**)
4. Ahí encontrarás:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) - Solo para uso en servidor

### 2. Crear Archivo de Variables de Entorno

1. Crea un archivo `.env.local` en la raíz del proyecto (junto a `package.json`)
2. Copia el contenido de `.env.example` y reemplaza los valores con tus claves reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 3. Verificar las Variables

Las variables de entorno se pueden revisar en:
- **Localmente**: Archivo `.env.local` (nunca subir a Git)
- **En Supabase Dashboard**: Settings → API
- **En producción** (Vercel/Netlify): Configuración del proyecto → Environment Variables

### ⚠️ Importante

- El archivo `.env.local` está en `.gitignore` y NO debe subirse a Git
- Las variables con prefijo `NEXT_PUBLIC_` son accesibles en el cliente
- `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en API routes o Server Components

## Próximos Pasos

Después de crear las tablas, considera:

1. Configurar Row Level Security (RLS) policies según tus necesidades
2. Crear funciones almacenadas para consultas complejas
3. Configurar storage buckets para los archivos de libros y imágenes
4. Crear vistas (views) para consultas comunes
5. Configurar las variables de entorno en tu aplicación

