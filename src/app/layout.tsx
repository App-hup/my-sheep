import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "الحظيرة - نظام إدارة حظيرة الأغنام",
  description: "نظام ذكي متكامل لإدارة حظيرة الأغنام - متابعة الحمل، تسجيل الأمراض، إدارة المواليد والأعلاف",
  keywords: ["حظيرة", "أغنام", "إدارة", "متابعة حمل", "أعلاف"],
  authors: [{ name: "الحظيرة" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-[family-name:var(--font-cairo)] antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
