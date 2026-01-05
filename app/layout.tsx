import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppHeader } from "@/components/layouts/app-header";
import { MobileNav } from "@/components/layouts/mobile-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripLedger - Holiday Expense Tracker",
  description: "Minimalistic expense tracking with fixed exchange rates for your holidays",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background pb-16 md:pb-0`}
      >
        <Providers>
          <AppHeader />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
