"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEditMode } from "./EditModeProvider";

const navLinks = [
  { href: "/", label: "Project View" },
  { href: "/employees", label: "Employee View" },
  { href: "/tasks", label: "Task Manager" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isEditMode, setEditMode } = useEditMode();

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Toggle Section */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">TeamManager</span>
            </div>

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
