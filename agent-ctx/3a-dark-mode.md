# Task 3a — Dark Mode Toggle

## Changes Made

### 1. `/src/app/layout.tsx`
- Imported `ThemeProvider` from `next-themes`
- Wrapped `{children}` and `<Toaster />` with `<ThemeProvider>` using:
  - `attribute="class"` — toggles the `.dark` CSS class on `<html>`
  - `defaultTheme="light"` — starts in light mode
  - `enableSystem` — respects OS preference
  - `disableTransitionOnChange` — prevents flash during theme switch

### 2. `/src/app/page.tsx`
- Imported `useTheme` from `next-themes`
- Imported `Sun` and `Moon` icons from `lucide-react`
- Added `resolvedTheme` and `setTheme` from `useTheme()` hook
- Added `toggleTheme()` function that swaps between light/dark
- Placed a ghost icon button in the header (between desktop stats and mobile menu button):
  - Shows Moon icon in light mode, Sun icon in dark mode
  - `aria-label="تبديل المظهر"` (Toggle appearance) for accessibility
  - Visible on both mobile and desktop breakpoints

### Verification
- ESLint: 0 errors
- Dev server: Compiling and serving successfully (GET / 200)
- Dark mode CSS variables already defined in globals.css (`.dark` class)
