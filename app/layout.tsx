import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSession } from "@/server/auth/auth.session";
import { SessionProvider } from "@/client/auth/SessionProvider";
import { ToastProvider } from "@/client/ui/feedback/ToastProvider";
import { CartProvider } from "@/client/cart/CartProvider";
import { OwnedBooksProvider } from "@/client/owned-books/OwnedBooksProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PulmoPrep | Modern Medical Literature Platform",
  description:
    "Secure and professional ebook platform for medical professionals and students.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full">
        <SessionProvider session={session}>
          <ToastProvider>
            <CartProvider>
              <OwnedBooksProvider>
                {children}
              </OwnedBooksProvider>
            </CartProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
