# Sistema de Gestión de Datos - Book Store

Este directorio contiene toda la lógica para conectar y gestionar los datos de Supabase en la aplicación.

## 📁 Estructura de Carpetas

```
src/
├── lib/
│   ├── supabase/           # Cliente y funciones de Supabase
│   │   ├── client.ts       # Configuración del cliente de Supabase
│   │   ├── books.ts        # Funciones para consultar libros
│   │   ├── authors.ts      # Funciones para consultar autores
│   │   ├── categories.ts   # Funciones para consultar categorías
│   │   ├── publishers.ts   # Funciones para consultar editores
│   │   └── index.ts        # Exportaciones centralizadas
│   └── USAGE_EXAMPLES.md   # Ejemplos de uso detallados
├── types/
│   └── database.ts         # Tipos TypeScript para todas las tablas
├── contexts/
│   └── BookStoreContext.tsx  # Contexto React para almacenar datos globalmente
├── hooks/
│   ├── useBooks.ts         # Hook para acceder a libros
│   ├── useAuthors.ts       # Hook para acceder a autores
│   ├── useCategories.ts    # Hook para acceder a categorías
│   └── index.ts            # Exportaciones centralizadas
└── components/
    └── examples/
        └── BooksExample.tsx  # Componente de ejemplo
```

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

Asegúrate de tener un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

### 2. El Provider ya está configurado

El `BookStoreProvider` ya está incluido en `src/app/layout.tsx`, por lo que todos los componentes tienen acceso a los datos.

### 3. Usar los Hooks en tus Componentes

```tsx
'use client';

import { useBooks } from '@/hooks';

export function MyComponent() {
  const { books, loading } = useBooks();
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      {books.map(book => (
        <div key={book.book_id}>{book.title}</div>
      ))}
    </div>
  );
}
```

## 📚 Hooks Disponibles

### `useBooks()`
Accede a todos los libros y funciones relacionadas.

**Retorna:**
- `books` - Array de todos los libros
- `booksWithRelations` - Libros con autores, categorías y editor incluidos
- `featuredBooks` - Solo libros destacados
- `availableBooks` - Solo libros con status 'available'
- `loading` - Estado de carga
- `getBookById(id)` - Función para obtener un libro por ID
- `getBooksByCategory(id)` - Función para obtener libros por categoría
- `getBooksByAuthor(id)` - Función para obtener libros por autor
- `searchBooks(term)` - Función para buscar libros
- `refreshBooks()` - Función para recargar los datos

### `useAuthors()`
Accede a todos los autores y funciones relacionadas.

**Retorna:**
- `authors` - Array de todos los autores
- `sortedAuthors` - Autores ordenados alfabéticamente
- `loading` - Estado de carga
- `getAuthorById(id)` - Función para obtener un autor por ID
- `searchAuthors(term)` - Función para buscar autores
- `refreshAuthors()` - Función para recargar los datos

### `useCategories()`
Accede a todas las categorías y funciones relacionadas.

**Retorna:**
- `categories` - Array de todas las categorías
- `mainCategories` - Solo categorías principales (sin padre)
- `hierarchicalCategories` - Categorías con sus subcategorías incluidas
- `loading` - Estado de carga
- `getCategoryById(id)` - Función para obtener una categoría por ID
- `getSubcategories(parentId)` - Función para obtener subcategorías
- `getParentCategory(category)` - Función para obtener la categoría padre
- `searchCategories(term)` - Función para buscar categorías
- `refreshCategories()` - Función para recargar los datos

## 🔄 Actualización de Datos

Los datos se cargan automáticamente cuando la aplicación se monta. También puedes actualizarlos manualmente:

```tsx
import { useBookStore } from '@/contexts/BookStoreContext';

function RefreshButton() {
  const { refreshAll, loading } = useBookStore();
  
  return (
    <button onClick={refreshAll} disabled={loading}>
      {loading ? 'Actualizando...' : 'Actualizar Datos'}
    </button>
  );
}
```

## 📖 Más Ejemplos

Para ver ejemplos más detallados, consulta:
- `src/lib/USAGE_EXAMPLES.md` - Ejemplos completos de uso
- `src/components/examples/BooksExample.tsx` - Componente de ejemplo funcional

## ⚠️ Notas Importantes

1. **Los datos están en memoria** - Se mantienen en el contexto de React durante toda la sesión
2. **Carga inicial automática** - Los datos se cargan cuando la app se inicia
3. **Actualización manual** - Usa las funciones `refresh*()` para actualizar cuando sea necesario
4. **Hooks solo en client components** - Recuerda usar `'use client'` en tus componentes
5. **Tipos TypeScript** - Todos los tipos están definidos en `src/types/database.ts`

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que tienes un archivo `.env.local` con las variables correctas
- Reinicia el servidor de desarrollo después de crear/modificar `.env.local`

### Los datos no se cargan
- Verifica que las tablas existan en Supabase
- Verifica que las variables de entorno sean correctas
- Revisa la consola del navegador para errores

### Error en las consultas
- Verifica que Row Level Security (RLS) esté configurado correctamente en Supabase
- Asegúrate de que las tablas y columnas coincidan con los tipos definidos

