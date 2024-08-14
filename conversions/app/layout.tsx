import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics as DubAnalytics } from "@dub/analytics/react";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark:bg-slate-950">
      <body className={inter.className}>{children}</body>
      <DubAnalytics />
    </html>
  );
}
