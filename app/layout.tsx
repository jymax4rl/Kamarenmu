import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const appName =
  process.env.NEXT_PUBLIC_APP_NAME || "Kama Renmu Jikke";

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description:
    "Kama Renmu Jikke — a mobile-first platform celebrating Soninke language, culture, and community.",
  openGraph: {
    title: appName,
    description: "Soninke language, stories, and community updates.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans min-h-dvh">
        {/* Animated background blobs — sit behind all content */}
        <div aria-hidden="true">
          <div className="blob blob-blue" />
          <div className="blob blob-red" />
          <div className="blob blob-violet" />
        </div>

        <Providers>
          <MobileContainer>
            <Header />
            <main className="relative flex-1 pt-14 pb-24 px-4">{children}</main>
            <BottomNav />
          </MobileContainer>
        </Providers>
      </body>
    </html>
  );
}
