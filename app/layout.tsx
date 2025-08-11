import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/Auth/SessionProvider";
import { FavoritesProvider } from "@/funcs/contexts/FavoritesContext";
import { CartProvider } from "@/funcs/contexts/CartContext";
import { ToastProvider } from "@/funcs/contexts/ToastContext";
import ToastWrapper from "@/components/ToastWrapper";
import UserInitializer from "@/components/UserInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodieApp - Delicious Food Delivered Fast",
  description: "Order from your favorite restaurants and get fresh, hot food delivered to your doorstep in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <FavoritesProvider>
            <CartProvider>
              <ToastProvider>
                <UserInitializer />
                {children}
                <ToastWrapper />
              </ToastProvider>
            </CartProvider>
          </FavoritesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
