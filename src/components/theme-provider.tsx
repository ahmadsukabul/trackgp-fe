"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ReactNode } from "react";

export { useTheme };

interface ThemeProviderProps {
  children: ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  [key: string]: unknown;
}

export function ThemeProvider({ children, ...options }: ThemeProviderProps) {
  return <NextThemesProvider {...options}>{children}</NextThemesProvider>;
}