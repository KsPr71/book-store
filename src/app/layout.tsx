import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BookStoreProvider } from "@/contexts/BookStoreContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { NavbarWrapper } from "@/components/navbar-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Book Store - Catálogo de Libros Electrónicos",
  description: "Catálogo de libros electrónicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BookStoreProvider>
          <NavigationProvider>
            <NavbarWrapper />
            {children}
          </NavigationProvider>
        </BookStoreProvider>
      </body>
    </html>
  );
}
