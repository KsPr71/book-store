-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA CATÁLOGO DE LIBROS ELECTRÓNICOS
-- =====================================================

-- Extensión para UUID (si no está habilitada por defecto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: publishers (Editores)
-- =====================================================
CREATE TABLE publishers (
    publisher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: authors (Autores)
-- =====================================================
CREATE TABLE authors (
    author_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    biography TEXT,
    photo_url VARCHAR(500),
    birth_date DATE,
    nationality VARCHAR(100),
    website VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: categories (Géneros/Categorías)
-- =====================================================
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(255) NOT NULL,
    parent_category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: books (Libros)
-- =====================================================
CREATE TABLE books (
    book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isbn VARCHAR(20) UNIQUE,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    publication_date DATE,
    publisher_id UUID REFERENCES publishers(publisher_id) ON DELETE SET NULL,
    language VARCHAR(50) DEFAULT 'es',
    page_count INTEGER,
    file_size NUMERIC(10, 2), -- En MB
    file_format VARCHAR(20), -- PDF, EPUB, MOBI, etc.
    cover_image_url VARCHAR(500),
    sample_url VARCHAR(500), -- Fragmento gratuito
    full_content_url VARCHAR(500), -- Archivo principal
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('available', 'draft', 'out_of_stock')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: book_authors (Relación Libros - Autores)
-- =====================================================
CREATE TABLE book_authors (
    book_id UUID REFERENCES books(book_id) ON DELETE CASCADE,
    author_id UUID REFERENCES authors(author_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'main_author' CHECK (role IN ('main_author', 'coauthor', 'editor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, author_id)
);

-- =====================================================
-- TABLA: book_categories (Relación Libros - Categorías)
-- =====================================================
CREATE TABLE book_categories (
    book_id UUID REFERENCES books(book_id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(category_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, category_id)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_is_featured ON books(is_featured);
CREATE INDEX idx_books_publisher_id ON books(publisher_id);
CREATE INDEX idx_books_publication_date ON books(publication_date);

-- Índices para autores
CREATE INDEX idx_authors_full_name ON authors(full_name);

-- Índices para categorías
CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_name ON categories(category_name);

-- Índices para relaciones
CREATE INDEX idx_book_authors_book_id ON book_authors(book_id);
CREATE INDEX idx_book_authors_author_id ON book_authors(author_id);
CREATE INDEX idx_book_categories_book_id ON book_categories(book_id);
CREATE INDEX idx_book_categories_category_id ON book_categories(category_id);

-- =====================================================
-- FUNCIONES PARA ACTUALIZACIÓN AUTOMÁTICA DE updated_at
-- =====================================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_publishers_updated_at
    BEFORE UPDATE ON publishers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authors_updated_at
    BEFORE UPDATE ON authors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS EN TABLAS Y COLUMNAS (Documentación)
-- =====================================================

COMMENT ON TABLE publishers IS 'Tabla de editores/publicadores de libros';
COMMENT ON TABLE authors IS 'Tabla de autores de libros';
COMMENT ON TABLE categories IS 'Tabla de categorías/géneros de libros con soporte para subcategorías';
COMMENT ON TABLE books IS 'Tabla principal de libros electrónicos';
COMMENT ON TABLE book_authors IS 'Tabla de relación muchos-a-muchos entre libros y autores';
COMMENT ON TABLE book_categories IS 'Tabla de relación muchos-a-muchos entre libros y categorías';

COMMENT ON COLUMN books.file_size IS 'Tamaño del archivo en MB';
COMMENT ON COLUMN books.file_format IS 'Formato del archivo: PDF, EPUB, MOBI, etc.';
COMMENT ON COLUMN books.sample_url IS 'URL al fragmento gratuito del libro';
COMMENT ON COLUMN books.full_content_url IS 'URL al archivo completo del libro';
COMMENT ON COLUMN books.status IS 'Estado del libro: available, draft, out_of_stock';
COMMENT ON COLUMN book_authors.role IS 'Rol del autor: main_author (autor principal), coauthor (coautor), editor (editor)';
COMMENT ON COLUMN categories.parent_category_id IS 'ID de la categoría padre para crear subcategorías jerárquicas';

