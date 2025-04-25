// src/app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { TRPCProvider } from "./providers";
import { Toaster } from "sonner";
import { SessionProvider } from "./SessionProvider";
import { authOptions } from "../server/auth";
import Navigation from "../components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecureSpot",
  description: "Secure your belongings with ease",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${inter.className} h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <SessionProvider session={session}>
          <TRPCProvider>
            <div className="min-h-full">
              <Navigation />
              <main className="py-10">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
