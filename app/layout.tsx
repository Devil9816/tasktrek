import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { EditModeProvider } from "@/components/EditModeProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "TeamManager — Project Management",
  description: "A clean project management tool for your team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
        <ThemeProvider>
          <EditModeProvider>
            <Navbar />
            <main className="max-w-screen-2xl mx-auto">
              {children}
            </main>
          </EditModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
