# Ejemplos de Uso del Sistema de Base de Datos

Esta guía muestra cómo usar los hooks y funciones para acceder a los datos de la base de datos en tus componentes.

## 📚 Uso Básico

### 1. Usar el Hook `useBooks`

```tsx
'use client';

import { useBooks } from '@/hooks';

export function BooksList() {
  const { books, loading, featuredBooks } = useBooks();

  if (loading) {
    return <div>Cargando libros...</div>;
  }

  return (
    <div>
      <h2>Libros Destacados</h2>
      {featuredBooks.map((book) => (
        <div key={book.book_id}>
          <h3>{book.title}</h3>
          <p>{book.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Buscar Libros

```tsx
'use client';

import { useState } from 'react';
import { useBooks } from '@/hooks';

export function SearchBooks() {
  const { searchBooks } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    const found = searchBooks(searchTerm);
    setResults(found);
  };

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar libros..."
      />
      <button onClick={handleSearch}>Buscar</button>
      
      {results.map((book) => (
        <div key={book.book_id}>{book.title}</div>
      ))}
    </div>
  );
}
```

### 3. Obtener Libros con Relaciones (Autores, Categorías)

```tsx
'use client';

import { useBooks } from '@/hooks';

export function BookDetail({ bookId }: { bookId: string }) {
  const { getBookById, loading } = useBooks();
  const book = getBookById(bookId);

  if (loading) return <div>Cargando...</div>;
  if (!book) return <div>Libro no encontrado</div>;

  return (
    <div>
      <h1>{book.title}</h1>
      {book.subtitle && <h2>{book.subtitle}</h2>}
      
      <div>
        <h3>Autores:</h3>
        {book.authors?.map((author) => (
          <span key={author.author_id}>
            {author.full_name} ({author.role})
          </span>
        ))}
      </div>

      <div>
        <h3>Categorías:</h3>
        {book.categories?.map((category) => (
          <span key={category.category_id}>
            {category.category_name}
          </span>
        ))}
      </div>

      {book.publisher && (
        <p>Editorial: {book.publisher.name}</p>
      )}
    </div>
  );
}
```

### 4. Usar el Hook `useAuthors`

```tsx
'use client';

import { useAuthors } from '@/hooks';

export function AuthorsList() {
  const { authors, loading, sortedAuthors } = useAuthors();

  if (loading) return <div>Cargando autores...</div>;

  return (
    <div>
      {sortedAuthors.map((author) => (
        <div key={author.author_id}>
          <h3>{author.full_name}</h3>
          {author.biography && <p>{author.biography}</p>}
          {author.nationality && <p>Nacionalidad: {author.nationality}</p>}
        </div>
      ))}
    </div>
  );
}
```

### 5. Usar el Hook `useCategories`

```tsx
'use client';

import { useCategories } from '@/hooks';

export function CategoriesList() {
  const { mainCategories, getSubcategories, hierarchicalCategories } = useCategories();

  return (
    <div>
      {hierarchicalCategories.map((category) => (
        <div key={category.category_id}>
          <h3>{category.category_name}</h3>
          {category.subcategories.length > 0 && (
            <ul>
              {category.subcategories.map((sub) => (
                <li key={sub.category_id}>{sub.category_name}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 6. Obtener Libros por Categoría

```tsx
'use client';

import { useBooks } from '@/hooks';

export function BooksByCategory({ categoryId }: { categoryId: string }) {
  const { getBooksByCategory, loading } = useBooks();
  const books = getBooksByCategory(categoryId);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Libros en esta categoría</h2>
      {books.map((book) => (
        <div key={book.book_id}>
          <h3>{book.title}</h3>
        </div>
      ))}
    </div>
  );
}
```

### 7. Usar el Contexto Directamente (si necesitas más control)

```tsx
'use client';

import { useBookStore } from '@/contexts/BookStoreContext';
import { useEffect } from 'react';

export function CustomComponent() {
  const {
    books,
    authors,
    categories,
    loading,
    refreshAll,
  } = useBookStore();

  useEffect(() => {
    // Recargar datos cuando sea necesario
    refreshAll();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <p>Total de libros: {books.length}</p>
      <p>Total de autores: {authors.length}</p>
      <p>Total de categorías: {categories.length}</p>
    </div>
  );
}
```

## 🔄 Actualizar Datos

Para actualizar los datos en cualquier componente:

```tsx
'use client';

import { useBookStore } from '@/contexts/BookStoreContext';

export function RefreshButton() {
  const { refreshAll, loading } = useBookStore();

  return (
    <button onClick={refreshAll} disabled={loading}>
      {loading ? 'Actualizando...' : 'Actualizar Datos'}
    </button>
  );
}
```

## 📝 Notas Importantes

1. **Todos los hooks están disponibles en el cliente** - Usa `'use client'` en tus componentes
2. **Los datos se cargan automáticamente** - El `BookStoreProvider` carga los datos al iniciar
3. **Los datos están almacenados en memoria** - Se mantienen disponibles en todos los componentes
4. **Puedes actualizar los datos** - Usa `refreshBooks()`, `refreshAuthors()`, etc.
5. **Los hooks incluyen funciones de búsqueda** - No necesitas hacer consultas directas a Supabase

## 🎯 Funciones Disponibles

### `useBooks()` retorna:
- `books` - Todos los libros
- `booksWithRelations` - Libros con autores, categorías y editor
- `featuredBooks` - Libros destacados
- `availableBooks` - Solo libros disponibles
- `availableBooksWithRelations` - Libros disponibles con relaciones
- `loading` - Estado de carga
- `getBookById(id)` - Obtener libro por ID
- `getBooksByCategory(id)` - Libros por categoría
- `getBooksByAuthor(id)` - Libros por autor
- `searchBooks(term)` - Buscar libros
- `refreshBooks()` - Recargar libros

### `useAuthors()` retorna:
- `authors` - Todos los autores
- `sortedAuthors` - Autores ordenados alfabéticamente
- `loading` - Estado de carga
- `getAuthorById(id)` - Obtener autor por ID
- `searchAuthors(term)` - Buscar autores
- `refreshAuthors()` - Recargar autores

### `useCategories()` retorna:
- `categories` - Todas las categorías
- `mainCategories` - Solo categorías principales
- `hierarchicalCategories` - Categorías con subcategorías
- `loading` - Estado de carga
- `getCategoryById(id)` - Obtener categoría por ID
- `getSubcategories(parentId)` - Subcategorías de una categoría
- `getParentCategory(category)` - Categoría padre
- `searchCategories(term)` - Buscar categorías
- `refreshCategories()` - Recargar categorías

