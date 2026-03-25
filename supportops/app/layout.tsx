import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalNav } from "@/components/navigation/ConditionalNav";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RaioX Preditivo Tecnologia",
  description: "Painel automatizado de triagem e gestão de tickets de suporte",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark" style={{ colorScheme: "dark" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#0a0a0a] text-[#ededed]`}
      >
        <TooltipProvider>
          <AuthProvider>
          <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
            <ConditionalNav />
            {children}
          </div>
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#111111",
                border: "1px solid #1a1a1a",
                color: "#ededed",
              },
            }}
          />
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
