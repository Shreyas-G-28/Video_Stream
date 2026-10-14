import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Video Stream",
  description: "A fast, responsive Video Streaming application built with Next.js, React, Tailwind CSS, and YouTube Data API.",
  keywords: ["Video Stream", "video streaming", "Next.js", "React", "YouTube"],
  authors: [{ name: "Video Stream Developer" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
    ],
  },
  openGraph: {
    title: "Video Stream",
    description: "Watch, search, and explore videos with subscriptions, watch history, and voice search.",
    type: "website",
    siteName: "Video Stream",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Stream",
    description: "Watch, search, and explore videos with subscriptions, watch history, and voice search.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}