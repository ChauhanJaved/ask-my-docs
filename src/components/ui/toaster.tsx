"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      position="bottom-right"
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-neutral-900 group-[.toaster]:text-neutral-900 group-[.toaster]:dark:text-white group-[.toaster]:border-neutral-200 group-[.toaster]:dark:border-neutral-800 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans text-xs",
          description: "group-[.toast]:text-neutral-500 group-[.toast]:dark:text-neutral-400 text-xs",
          actionButton:
            "group-[.toast]:bg-brand-600 group-[.toast]:text-white font-medium text-xs",
          cancelButton:
            "group-[.toast]:bg-neutral-100 group-[.toast]:dark:bg-neutral-800 group-[.toast]:text-neutral-500 text-xs",
        },
      }}
    />
  );
}
