import type { Metadata } from "next";
import { Geist, Geist_Mono, Quicksand, Montserrat } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Griot and Grits - Black Voices Worth Remembering, Black History Worth Sharing.",
  description: `Griot and Grits is a new take on the West African Griot, the storytelling, 
  singing, poet, historian of the village that was tasked with passing on the history of the village orally.
  Our mission is to preserve the history of the Black experience one voice at a time using AI 
  and other advanced technologies.`,
  keywords: "Black experience, African American experience, AI technology, content enrichment, metadata extraction, searchable index",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="/browser-polyfills.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} ${montserrat.variable} tracking-tighter antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
