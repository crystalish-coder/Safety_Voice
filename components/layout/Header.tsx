"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, AlertTriangle, FileText, Menu, X, Lock } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "홈" },
    { href: "/board", label: "안전 의견" },
    { href: "/msds", label: "MSDS / SDS" },
    { href: "/guide", label: "이용안내" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 font-bold text-slate-900 transition hover:opacity-90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ONCOBIX Logo" className="h-7 w-auto object-contain" />
          <div className="h-4 w-px bg-slate-300 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">Safety Voice</span>
            <span className="hidden text-xs font-semibold text-oncobix-500 sm:inline-block">안전 익명 제보</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-oncobix-50 text-oncobix-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action & Anonymity Badge */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700">
            <Lock className="h-3 w-3" />
            <span>익명 보장</span>
          </div>

          <Link
            href="/board/new"
            className="flex items-center gap-1.5 rounded-lg bg-oncobix-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-oncobix-600 active:scale-[0.98]"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>의견 작성</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/board/new"
            className="rounded-md bg-oncobix-500 p-2 text-white shadow-sm hover:bg-oncobix-600"
            title="의견 작성"
          >
            <AlertTriangle className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="메뉴 열기"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <Lock className="h-3.5 w-3.5" /> 100% 익명성 보호 모드
            </span>
          </div>
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  isActive(link.href)
                    ? "bg-oncobix-50 text-oncobix-600 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
