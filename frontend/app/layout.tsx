import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Background from "@/components/Background";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { Lato } from "next/font/google";
import { Providers } from './providers';

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Ethera",
  description: "Ethera",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} antialiased`}
      >
        <Providers>
          <Background />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
