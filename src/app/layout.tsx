import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Topbar } from "./components/Topbar";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/next"
import { CityRootProvider } from "./CityRootContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gemify",
  description: "Find and share hidden gems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CityRootProvider>
      <html lang="en" className={`h-full ${geistSans.variable} ${geistMono.variable}`}>
        <body className="min-h-screen flex flex-col font-geist bg-white text-zinc-700">
          <Topbar />
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
          <Footer />
          <Analytics />
        </body>
      </html>
    </CityRootProvider>
  );
}
