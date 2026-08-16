"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by waiting until mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-lg opacity-70"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="w-4 h-4 text-neutral-500" />
      </Button>
    );
  }

  const themes = [
    {
      id: "light",
      label: "Light",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Dark",
      icon: Moon,
    },
    {
      id: "system",
      label: "System",
      icon: Monitor,
    },
  ];

  const currentIcon = () => {
    if (theme === "system") return Monitor;
    return resolvedTheme === "dark" ? Moon : Sun;
  };

  const IconComponent = currentIcon();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
        aria-expanded={isOpen}
        className="w-9 h-9 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <IconComponent className="w-4 h-4 transition-transform duration-200" />
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg shadow-neutral-950/10 dark:shadow-black/40 py-1.5 z-50 animate-in fade-in-80 zoom-in-95 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-2.5 py-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Theme Mode
          </div>
          {themes.map((t) => {
            const ThemeIcon = t.icon;
            const isSelected = theme === t.id;

            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-950/40"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80"
                }`}
                role="menuitem"
              >
                <div className="flex items-center space-x-2.5">
                  <ThemeIcon className="w-4 h-4 opacity-80" />
                  <span>{t.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
