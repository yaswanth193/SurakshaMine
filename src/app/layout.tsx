import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CoalGov360 - Smart Mine Governance",
  description: "AI-powered compliance monitoring for Indian coal mines",
};

import { AuthGuard } from "@/components/providers/AuthGuard";
import { Providers } from "@/components/providers/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}