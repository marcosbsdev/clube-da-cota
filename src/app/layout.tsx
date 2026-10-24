import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clube da Cota - Consórcio entre Amigos",
  description: "Gerencie consórcios com amigos e familiares de forma simples, transparente e segura.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Clube da Cota",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#044E3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} theme-blue bg-slate-100 min-h-screen text-slate-800 antialiased`}>
        <ThemeProvider initialTheme="blue">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
