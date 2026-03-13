"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEditMode } from "./EditModeProvider";
import { useTheme } from "./ThemeProvider";

const navLinks = [
  { href: "/", label: "Project View" },
  { href: "/employees", label: "Employee View" },
  { href: "/tasks", label: "Task Manager" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isEditMode, setEditMode } = useEditMode();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Toggle Section */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="flex items-center justify-center bg-white rounded-xl p-1.5 w-10 h-10 shadow-md shadow-red-500/10 border border-slate-200 dark:border-slate-800">
                <svg viewBox="0 0 512 512" className="w-full h-full" fill="#CE2029" xmlns="http://www.w3.org/2000/svg">
                  <path d="M125.8 40.5c-20.4 0-38 16.5-38 37v356.9c0 20.4 17.6 37 38 37h223.1V40.5H125.8z" />
                  <path d="M374.9 40.5L374.9 471.5 423.5 471.5c15.7 0 29.5-12 29.5-27.7V68.2c0-15.7-13.8-27.7-29.5-27.7H374.9z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight leading-none text-white">Khatabook</span>
                <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase mt-1">TeamManager</span>
              </div>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all text-slate-300 hover:text-white group"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 18v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* Read/Edit Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-950/40 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-inner">
              <button
                onClick={() => setEditMode(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${!isEditMode
                  ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Read Mode
              </button>
              <button
                onClick={() => setEditMode(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${isEditMode
                  ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-105"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Mode
              </button>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                    ? "bg-red-600 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
