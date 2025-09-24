import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zenith Finance",
  description:
    "Personal finance operations console for budgets, transactions, drafts, and insights.",
  metadataBase: new URL("https://zenith-finance.local"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-surface text-ink">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-surface text-ink`}
      >
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
