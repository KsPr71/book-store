# Cómo Asociar Autores y Categorías a Libros

## 📋 Estructura de Relaciones

Los autores **NO** están directamente en la tabla `books`. La estructura es:

- **books** → tabla principal
- **authors** → tabla de autores
- **book_authors** → tabla de relación (conecta libros con autores)
- **categories** → tabla de categorías
- **book_categories** → tabla de relación (conecta libros con categorías)

## 🔗 Asociar un Autor a un Libro

### Opción 1: Desde el SQL Editor de Supabase

```sql
-- 1. Primero crea un autor (si no existe)
INSERT INTO authors (full_name, biography, nationality)
VALUES ('Gabriel García Márquez', 'Escritor colombiano...', 'Colombiana')
RETURNING author_id;

-- 2. Luego asocia el autor con un libro
-- Reemplaza BOOK_ID y AUTHOR_ID con los valores reales
INSERT INTO book_authors (book_id, author_id, role)
VALUES (
  'BOOK_ID_AQUI',  -- ID del libro (UUID)
  'AUTHOR_ID_AQUI', -- ID del autor (UUID)
  'main_author' -- rol: 'main_author', 'coauthor', o 'editor'
);
```

### Opción 2: Usando la interfaz de Supabase

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla **book_authors**
3. Haz clic en **Insert row**
4. Llena los campos:
   - `book_id`: Selecciona el libro de la lista desplegable
   - `author_id`: Selecciona el autor de la lista desplegable
   - `role`: Selecciona el rol (`main_author`, `coauthor`, o `editor`)

## 🏷️ Asociar una Categoría a un Libro

### Opción 1: Desde el SQL Editor

```sql
-- 1. Primero crea una categoría (si no existe)
INSERT INTO categories (category_name, description)
VALUES ('Ficción', 'Libros de ficción...')
RETURNING category_id;

-- 2. Luego asocia la categoría con un libro
INSERT INTO book_categories (book_id, category_id)
VALUES ('BOOK_ID_AQUI', 'CATEGORY_ID_AQUI');
```

### Opción 2: Usando la interfaz de Supabase

1. Ve a **Table Editor** → **book_categories**
2. Haz clic en **Insert row**
3. Llena:
   - `book_id`: Selecciona el libro
   - `category_id`: Selecciona la categoría

## 📝 Ejemplo Completo

Para asociar un autor y una categoría a un libro existente:

```sql
-- Supongamos que ya tienes:
-- - Un libro con ID: 'abc-123...'
-- - Un autor con ID: 'xyz-456...'
-- - Una categoría con ID: 'cat-789...'

-- Asociar autor
INSERT INTO book_authors (book_id, author_id, role)
VALUES ('abc-123...', 'xyz-456...', 'main_author');

-- Asociar categoría
INSERT INTO book_categories (book_id, category_id)
VALUES ('abc-123...', 'cat-789...');
```

## 🔍 Verificar las Relaciones

Para ver qué autores y categorías tiene un libro:

```sql
SELECT 
  b.title,
  b.book_id,
  a.full_name as autor,
  c.category_name as categoria
FROM books b
LEFT JOIN book_authors ba ON b.book_id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.author_id
LEFT JOIN book_categories bc ON b.book_id = bc.book_id
LEFT JOIN categories c ON bc.category_id = c.category_id
WHERE b.book_id = 'TU_BOOK_ID_AQUI';
```

## ⚠️ Importante

- **Un libro puede tener múltiples autores** (crea múltiples registros en `book_authors`)
- **Un libro puede tener múltiples categorías** (crea múltiples registros en `book_categories`)
- Si no ves autores en las cards, verifica que hay registros en `book_authors`
- Si no ves categorías, verifica que hay registros en `book_categories`

