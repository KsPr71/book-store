import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BookStoreProvider } from "@/contexts/BookStoreContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CardSizeProvider } from "@/contexts/CardSizeContext";
import { NavbarWrapper } from "@/components/navbar-wrapper";
import { FooterWithLogo } from "@/components/ui/footer";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";


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
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <BookStoreProvider>
            <AuthProvider>
              <CardSizeProvider>
                <NavigationProvider>
                  <NavbarWrapper />
                  {children}
             
                  <FooterWithLogo/>
                </NavigationProvider>
              </CardSizeProvider>
            </AuthProvider>
          </BookStoreProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
