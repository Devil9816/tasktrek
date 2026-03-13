import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { EditModeProvider } from "@/components/EditModeProvider";

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
      <body className="min-h-screen bg-slate-50 antialiased">
        <EditModeProvider>
          <Navbar />
          <main className="max-w-screen-2xl mx-auto">
            {children}
          </main>
        </EditModeProvider>
      </body>
    </html>
  );
}
