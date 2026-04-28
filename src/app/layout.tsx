import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AppForge — Turn JSON into Working Apps",
  description:
    "AppForge is a JSON-to-app generator platform. Define your data model in JSON and get dynamic forms, tables, dashboards and APIs instantly.",
  keywords: ["app generator", "JSON config", "no-code", "low-code", "dynamic forms"],
  openGraph: {
    title: "AppForge — Turn JSON into Working Apps",
    description: "Build dynamic web apps from JSON configuration in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#0b1326] text-white`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
