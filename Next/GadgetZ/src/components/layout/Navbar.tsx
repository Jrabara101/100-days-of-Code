"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const navLinks = [
  { label: "Smartphones", href: "#" },
  { label: "Laptops", href: "#" },
  { label: "Audio", href: "#" },
  { label: "Wearables", href: "#" },
  { label: "Gaming", href: "#" },
  { label: "Smart Home", href: "#" },
  { label: "Cameras", href: "#" },
  { label: "Accessories", href: "#" },
  { label: "Deals", href: "#", highlight: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gadget-dark/90 backdrop-blur-xl border-b border-gadget-border shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "bg-gadget-dark/70 backdrop-blur-md border-b border-gadget-border/50"
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center gap-6 h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0 font-montserrat font-900 text-xl tracking-tight">
            GADGET
            <span className="text-gadget-cyan">Z</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-montserrat font-500 transition-colors duration-200 whitespace-nowrap ${
                  link.highlight
                    ? "text-gadget-amber hover:text-gadget-amber/80"
                    : "text-gadget-muted hover:text-gadget-text hover:bg-gadget-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Medium nav — scrollable */}
          <nav className="hidden md:flex lg:hidden items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
            {navLinks.slice(0, 6).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-sm font-montserrat font-500 text-gadget-muted hover:text-gadget-text hover:bg-gadget-surface transition-colors duration-200 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
            <button className="flex items-center gap-0.5 px-3 py-1.5 rounded-lg text-sm text-gadget-muted hover:text-gadget-text hover:bg-gadget-surface transition-colors duration-200 whitespace-nowrap">
              More <ChevronDown className="w-3 h-3" />
            </button>
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Search toggle */}
            <button
              aria-label="Search"
              onClick={() => setSearchOpen((p) => !p)}
              className="p-2 rounded-lg text-gadget-muted hover:text-gadget-text hover:bg-gadget-surface transition-colors duration-200"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <button
              aria-label="Wishlist"
              className="hidden sm:flex p-2 rounded-lg text-gadget-muted hover:text-gadget-text hover:bg-gadget-surface transition-colors duration-200"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* Cart */}
            <button
              aria-label="Cart"
              className="relative p-2 rounded-lg text-gadget-muted hover:text-gadget-text hover:bg-gadget-surface transition-colors duration-200"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-1 right-1 bg-gadget-cyan text-gadget-dark text-[9px] font-montserrat font-800 w-4 h-4 rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Account */}
            <button
              aria-label="Account"
              className="hidden sm:flex p-2 rounded-lg text-gadget-muted hover:text-gadget-text hover:bg-gadget-surface transition-colors duration-200"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Mobile menu toggle */}
            <button
              aria-label="Menu"
              onClick={() => setMobileOpen((p) => !p)}
              className="md:hidden p-2 rounded-lg text-gadget-muted hover:text-gadget-text hover:bg-gadget-surface transition-colors duration-200"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Inline search bar */}
        {searchOpen && (
          <div className="pb-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gadget-muted" />
              <input
                type="search"
                autoFocus
                placeholder="Search gadgets, brands, categories..."
                className="w-full bg-gadget-surface border border-gadget-border rounded-xl pl-11 pr-4 py-3 text-sm text-gadget-text placeholder:text-gadget-muted focus:outline-none focus:border-gadget-cyan/60 transition-colors duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gadget-border bg-gadget-surface animate-slide-up">
          <nav className="flex flex-col px-4 py-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-montserrat font-500 transition-colors duration-200 ${
                  link.highlight
                    ? "text-gadget-amber bg-gadget-amber/5"
                    : "text-gadget-muted hover:text-gadget-text hover:bg-gadget-border/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gadget-border mt-2 pt-3 flex gap-4 px-4">
              <button className="flex items-center gap-2 text-gadget-muted text-sm">
                <Heart className="w-4 h-4" /> Wishlist
              </button>
              <button className="flex items-center gap-2 text-gadget-muted text-sm">
                <User className="w-4 h-4" /> Sign In
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
