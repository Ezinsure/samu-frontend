"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/lib/auth/auth-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "font-sans border border-border bg-surface text-foreground shadow-[var(--samu-shadow-dropdown)]",
              title: "text-foreground font-medium",
              description: "text-foreground-secondary",
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
