import type { Metadata } from "next";
import { Inter, Barlow, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaskPro — Field Service Management",
  description: "Manage jobs, tasks, workers, and time tracking for your field service business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${barlow.variable} ${jetbrainsMono.variable} font-sans antialiased bg-zinc-100 text-zinc-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
