
 
  import Image from "next/image";// src/components/ui/footer.tsx
export function FooterWithLogo() {
    return (
      <footer className="bg-blue-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Logo */}
            <div className="flex items-center mb-4 md:mb-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                <Image
                    alt="logo"
                    src= '/logo2.svg'
                    width={100}
                    height={100}
                />
              </div>
            </div>
  
            {/* Links */}
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Inicio
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Libros
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Autores
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Contacto
              </a>
            </div>
  
            {/* Copyright */}
            <div className="mt-4 md:mt-0">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} Click & Read. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }