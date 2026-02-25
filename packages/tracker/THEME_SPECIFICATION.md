# Codebase Tracker Theme - Complete Color & Design Specification

## Context

This document is a precise, exhaustive breakdown of every color, shadow, opacity, border, radius, and visual detail found in the Codebase Tracker theme. The theme is a **dark-first** design built on **shadcn/ui (new-york style)** with **Tailwind CSS v4** and **OKLCH** color space. Every hex value below was computed from the original OKLCH source values.

The application uses **two CSS files** -- `app/globals.css` is the **active theme** (a custom dark purple-tinted palette), while `styles/globals.css` contains the default shadcn neutral light/dark fallback. The active theme is the one that ships.

---

## 1. CORE THEME TOKENS (app/globals.css -- THE ACTIVE THEME)

All values defined in `:root` -- this is a permanently dark theme (no light mode toggle).

### Foundation Colors

| Token | OKLCH Source | Hex | Role |
|-------|-------------|-----|------|
| `--background` | `oklch(0.13 0.005 285)` | `#070709` | Page background -- near-black with a cold blue-violet tint |
| `--foreground` | `oklch(0.95 0 0)` | `#eeeeee` | Primary text -- soft white, not pure |
| `--card` | `oklch(0.17 0.005 285)` | `#0f0f12` | Card/panel surfaces -- slightly elevated from bg |
| `--card-foreground` | `oklch(0.95 0 0)` | `#eeeeee` | Card text -- matches foreground |
| `--popover` | `oklch(0.17 0.005 285)` | `#0f0f12` | Popover/dropdown surfaces -- same as card |
| `--popover-foreground` | `oklch(0.95 0 0)` | `#eeeeee` | Popover text |

### Brand & Accent Colors

| Token | OKLCH Source | Hex | Role |
|-------|-------------|-----|------|
| `--primary` | `oklch(0.65 0.2 275)` | `#6f7dff` | Primary brand -- vivid periwinkle blue-purple |
| `--primary-foreground` | `oklch(0.98 0 0)` | `#f8f8f8` | Text on primary -- near-white |
| `--secondary` | `oklch(0.22 0.008 285)` | `#1a1a1e` | Secondary surfaces -- very dark blue-gray |
| `--secondary-foreground` | `oklch(0.85 0 0)` | `#cecece` | Secondary text -- light gray |
| `--accent` | `oklch(0.25 0.015 285)` | `#212129` | Accent/hover surfaces -- slightly lighter than secondary |
| `--accent-foreground` | `oklch(0.95 0 0)` | `#eeeeee` | Accent text |

### Muted & Disabled

| Token | OKLCH Source | Hex | Role |
|-------|-------------|-----|------|
| `--muted` | `oklch(0.22 0.008 285)` | `#1a1a1e` | Muted backgrounds -- same as secondary |
| `--muted-foreground` | `oklch(0.6 0.01 285)` | `#7f7f86` | Muted text -- medium gray with slight blue cast |

### Destructive / Error

| Token | OKLCH Source | Hex | Role |
|-------|-------------|-----|------|
| `--destructive` | `oklch(0.55 0.22 27)` | `#d40c1a` | Error/delete background -- vivid crimson red |
| `--destructive-foreground` | `oklch(0.95 0 0)` | `#eeeeee` | Text on destructive |

### Borders, Inputs & Focus

| Token | OKLCH Source | Hex | Role |
|-------|-------------|-----|------|
| `--border` | `oklch(0.25 0.01 285)` | `#212126` | Default border -- subtle dark divider with blue undertone |
| `--input` | `oklch(0.22 0.008 285)` | `#1a1a1e` | Input field background |
| `--ring` | `oklch(0.65 0.2 275)` | `#6f7dff` | Focus ring -- matches primary |

### Chart Palette

| Token | OKLCH Source | Hex | Visual |
|-------|-------------|-----|--------|
| `--chart-1` | `oklch(0.65 0.2 275)` | `#6f7dff` | Periwinkle blue-purple (matches primary) |
| `--chart-2` | `oklch(0.7 0.17 162)` | `#00be7d` | Vivid mint green |
| `--chart-3` | `oklch(0.75 0.15 55)` | `#f59145` | Warm tangerine orange |
| `--chart-4` | `oklch(0.6 0.22 27)` | `#e62c2c` | Bold scarlet red |
| `--chart-5` | `oklch(0.65 0.18 330)` | `#c95fc2` | Rich orchid magenta |

### Sidebar

| Token | OKLCH Source | Hex | Role |
|-------|-------------|-----|------|
| `--sidebar` | `oklch(0.15 0.005 285)` | `#0b0b0d` | Sidebar bg -- darker than page bg |
| `--sidebar-foreground` | `oklch(0.95 0 0)` | `#eeeeee` | Sidebar text |
| `--sidebar-primary` | `oklch(0.65 0.2 275)` | `#6f7dff` | Sidebar active/primary accent |
| `--sidebar-primary-foreground` | `oklch(0.98 0 0)` | `#f8f8f8` | Sidebar primary text |
| `--sidebar-accent` | `oklch(0.22 0.008 285)` | `#1a1a1e` | Sidebar hover bg |
| `--sidebar-accent-foreground` | `oklch(0.95 0 0)` | `#eeeeee` | Sidebar hover text |
| `--sidebar-border` | `oklch(0.25 0.01 285)` | `#212126` | Sidebar dividers |
| `--sidebar-ring` | `oklch(0.65 0.2 275)` | `#6f7dff` | Sidebar focus ring |

### Border Radius

| Token | Formula | Computed |
|-------|---------|----------|
| `--radius` | `0.5rem` | 8px |
| `--radius-sm` | `calc(0.5rem - 4px)` | 4px |
| `--radius-md` | `calc(0.5rem - 2px)` | 6px |
| `--radius-lg` | `0.5rem` | 8px |
| `--radius-xl` | `calc(0.5rem + 4px)` | 12px |

### Typography

| Token | Value |
|-------|-------|
| `--font-sans` | `'Geist', 'Geist Fallback'` |
| `--font-mono` | `'Geist Mono', 'Geist Mono Fallback'` |

---

## 2. NOTATION TYPE COLORS (15 types)

Each type has a triple: **text color** (label text), **background** (at 15% opacity), **border** (at 30% opacity). All derived from Tailwind's standard palette.

| Type | Text Color | Text Hex | Base-500 Hex | BG (15% opacity) | Border (30% opacity) |
|------|-----------|----------|-------------|-------------------|---------------------|
| **TODO** | `text-blue-300` | `#93c5fd` | `#3b82f6` | `#3b82f6` at 15% | `#3b82f6` at 30% |
| **FIXME** | `text-amber-300` | `#fcd34d` | `#f59e0b` | `#f59e0b` at 15% | `#f59e0b` at 30% |
| **BUG** | `text-red-400` | `#f87171` | `#ef4444` | `#ef4444` at 15% | `#ef4444` at 30% |
| **HACK** | `text-orange-300` | `#fdba74` | `#f97316` | `#f97316` at 15% | `#f97316` at 30% |
| **NOTE** | `text-slate-300` | `#cbd5e1` | `#64748b` | `#64748b` at 15% | `#64748b` at 30% |
| **OPTIMIZE** | `text-cyan-300` | `#67e8f9` | `#06b6d4` | `#06b6d4` at 15% | `#06b6d4` at 30% |
| **SECURITY** | `text-rose-400` | `#fb7185` | `#f43f5e` | `#f43f5e` at 15% | `#f43f5e` at 30% |
| **TICKET** | `text-violet-300` | `#c4b5fd` | `#8b5cf6` | `#8b5cf6` at 15% | `#8b5cf6` at 30% |
| **TASK** | `text-emerald-300` | `#6ee7b7` | `#10b981` | `#10b981` at 15% | `#10b981` at 30% |
| **DEBT** | `text-yellow-300` | `#fde047` | `#eab308` | `#eab308` at 15% | `#eab308` at 30% |
| **REFACTOR** | `text-indigo-300` | `#a5b4fc` | `#6366f1` | `#6366f1` at 15% | `#6366f1` at 30% |
| **DEPRECATION** | `text-pink-300` | `#f9a8d4` | `#ec4899` | `#ec4899` at 15% | `#ec4899` at 30% |
| **MIGRATION** | `text-teal-300` | `#5eead4` | `#14b8a6` | `#14b8a6` at 15% | `#14b8a6` at 30% |
| **PERF** | `text-lime-300` | `#bef264` | `#84cc16` | `#84cc16` at 15% | `#84cc16` at 30% |
| **TEST** | `text-sky-300` | `#7dd3fc` | `#0ea5e9` | `#0ea5e9` at 15% | `#0ea5e9` at 30% |

---

## 3. PRIORITY COLORS (5 levels)

| Priority | Text Class | Text Hex | Dot Class | Dot Hex |
|----------|-----------|----------|-----------|---------|
| **critical** | `text-red-400` | `#f87171` | `bg-red-400` | `#f87171` |
| **high** | `text-orange-400` | `#fb923c` | `bg-orange-400` | `#fb923c` |
| **medium** | `text-yellow-400` | `#facc15` | `bg-yellow-400` | `#facc15` |
| **low** | `text-blue-400` | `#60a5fa` | `bg-blue-400` | `#60a5fa` |
| **minimal** | `text-slate-400` | `#94a3b8` | `bg-slate-500` | `#64748b` |

---

## 4. STATUS COLORS (4 states)

| Status | Text Class | Text Hex | Dot Class | Dot Hex | Label |
|--------|-----------|----------|-----------|---------|-------|
| **open** | `text-blue-400` | `#60a5fa` | `bg-blue-400` | `#60a5fa` | "Open" |
| **in_progress** | `text-amber-400` | `#fbbf24` | `bg-amber-400` | `#fbbf24` | "In Progress" |
| **blocked** | `text-red-400` | `#f87171` | `bg-red-400` | `#f87171` | "Blocked" |
| **resolved** | `text-emerald-400` | `#34d399` | `bg-emerald-400` | `#34d399` | "Resolved" |

---

## 5. STAT CARD ACCENT BORDERS

The primary stat cards use a left-border accent (2px, `border-l-2`):

| Stat | Border Class | Hex |
|------|-------------|-----|
| Total | `border-[oklch(0.65_0.2_275)]` | `#6f7dff` |
| Overdue | `border-red-500` | `#ef4444` |
| Blocked | `border-amber-500` | `#f59e0b` |
| Debt Hours | `border-yellow-500` | `#eab308` |
| Critical | `border-rose-500` | `#f43f5e` |
| In Progress | `border-emerald-500` | `#10b981` |

### Type Count Cards (secondary row)

| Category | Icon Color | Icon Hex | Border | Border Hex (at 40%) |
|----------|-----------|----------|--------|---------------------|
| Security | `text-rose-400` | `#fb7185` | `border-rose-500/40` | `#f43f5e` at 40% |
| Bugs | `text-red-400` | `#f87171` | `border-red-500/40` | `#ef4444` at 40% |
| Tickets | `text-violet-400` | `#a78bfa` | `border-violet-500/40` | `#8b5cf6` at 40% |
| Tasks | `text-emerald-400` | `#34d399` | `border-emerald-500/40` | `#10b981` at 40% |
| Tech Debt | `text-yellow-400` | `#facc15` | `border-yellow-500/40` | `#eab308` at 40% |
| Perf | `text-cyan-400` | `#22d3ee` | `border-cyan-500/40` | `#06b6d4` at 40% |

---

## 6. COMPONENT-SPECIFIC COLORS

### Notation List

| Element | Class | Hex |
|---------|-------|-----|
| Selected item bg | `bg-accent/40` | `#212129` at 40% opacity |
| Selected left border | `border-l-primary` | `#6f7dff` |
| Hover bg | `bg-accent/30` | `#212129` at 30% opacity |
| Description text | `text-foreground/90` | `#eeeeee` at 90% |
| File path text | `text-muted-foreground/60` | `#7f7f86` at 60% |
| Ticket ID | `text-violet-400` | `#a78bfa` |
| Overdue date | `text-red-400` | `#f87171` |
| Sprint badge bg | `bg-accent` | `#212129` |

### Notation Detail Panel

| Element | Class | Hex |
|---------|-------|-----|
| Panel bg | `bg-card` | `#0f0f12` |
| Active status button bg | `bg-primary/10` | `#6f7dff` at 10% |
| Active status border | `border-primary/40` | `#6f7dff` at 40% |
| Inactive button hover | `bg-accent/50` | `#212129` at 50% |
| Section labels | `text-muted-foreground/60` | `#7f7f86` at 60% |
| Overdue alert text | `text-red-400` | `#f87171` |
| Resolve button bg | `bg-emerald-600` | `#059669` |
| Resolve button hover | `hover:bg-emerald-700` | `#047857` |
| Resolve button text | `text-emerald-50` | `#ecfdf5` |

### Dashboard Header

| Element | Class | Hex |
|---------|-------|-----|
| Logo icon | `text-primary` | `#6f7dff` |
| Title text | `text-foreground` | `#eeeeee` |
| Version badge bg | `bg-primary/15` | `#6f7dff` at 15% |
| Version badge text | `text-primary` | `#6f7dff` |
| Active filter btn | `bg-primary text-primary-foreground` | `#6f7dff` bg, `#f8f8f8` text |
| Item count icon + text | `text-muted-foreground` | `#7f7f86` |

### Search Bar

| Element | Class | Hex |
|---------|-------|-----|
| Input bg | `bg-secondary` | `#1a1a1e` |
| Input text | `text-foreground` | `#eeeeee` |
| Placeholder text | `text-muted-foreground` | `#7f7f86` |
| Search icon | `text-muted-foreground` | `#7f7f86` |

### Add Notation Dialog

| Element | Class | Hex |
|---------|-------|-----|
| Dialog bg | `bg-card` | `#0f0f12` |
| Title | `text-foreground` | `#eeeeee` |
| Labels | `text-muted-foreground` | `#7f7f86` |
| Input fields bg | `bg-secondary` | `#1a1a1e` |
| Input text | `text-foreground` | `#eeeeee` |
| Inactive type btn | `border-border text-muted-foreground` | `#212126` border, `#7f7f86` text |
| Active type btn | Uses TYPE_CONFIG colors | (per-type, see Section 2) |
| Active priority btn | `border-primary/40 bg-primary/10` | `#6f7dff` at 40%/10% |
| Submit btn | `bg-primary text-primary-foreground` | `#6f7dff` bg, `#f8f8f8` text |

### Scheduler / Sprint Board

| Element | Class | Hex |
|---------|-------|-----|
| Progress bar track | `bg-secondary` | `#1a1a1e` |
| Progress resolved | `bg-emerald-500` | `#10b981` |
| Progress in-progress | `bg-amber-500` | `#f59e0b` |
| Sprint card bg | `bg-card/60` | `#0f0f12` at 60% |
| Sprint card border | `border-border` | `#212126` |
| Overdue card border | `border-red-500/30` | `#ef4444` at 30% |
| Card description | `text-foreground/80` | `#eeeeee` at 80% |
| Backlog card bg | `bg-card/30` | `#0f0f12` at 30% |
| Backlog card border | `border-border/50` | `#212126` at 50% |
| Backlog description | `text-foreground/60` | `#eeeeee` at 60% |

### Filter Sidebar

| Element | Class | Hex |
|---------|-------|-----|
| Section labels | `text-muted-foreground/60` | `#7f7f86` at 60% |
| Active filter bg | `bg-accent` | `#212129` |
| Active filter text | `text-foreground` | `#eeeeee` |
| Inactive filter text | `text-muted-foreground` | `#7f7f86` |
| Inactive hover bg | `bg-accent/50` | `#212129` at 50% |

---

## 7. OPACITY SCALE

| Opacity | Usage |
|---------|-------|
| 10% | Active selection backgrounds (`bg-primary/10`) |
| 15% | Type badge backgrounds, version badge bg |
| 30% | Type badge borders, hover states, border fading |
| 40% | Type count card borders, active selection borders |
| 50% | Focus ring (`ring-ring/50`), border fading, hover bg |
| 60% | Muted section labels, file paths, backlog descriptions |
| 80% | Sprint card descriptions |
| 90% | List item descriptions |

---

## 8. SHADOWS

The theme uses Tailwind's built-in shadow scale. No custom shadows are defined.

| Shadow | Usage |
|--------|-------|
| `shadow-xs` | Input fields, select triggers, switches, slider thumbs |
| `shadow-sm` | Cards, tabs triggers, floating sidebar |
| `shadow-md` | Select dropdown content |
| `shadow-lg` | Dialogs, toasts, sheet panels |

---

## 9. GLOBAL STYLES

| Property | Value |
|----------|-------|
| All elements default border | `border-border` (`#212126`) |
| All elements default outline | `outline-ring/50` (`#6f7dff` at 50%) |
| Body background | `bg-background` (`#070709`) |
| Body text | `text-foreground` (`#eeeeee`) |
| Body font | `font-sans antialiased` (Geist) |
| Focus ring width | 3px (`ring-[3px]`) |
| Focus ring color | `ring-ring/50` (`#6f7dff` at 50%) |
| Focus border | `border-ring` (`#6f7dff`) |
| Disabled state | `opacity-50`, `pointer-events-none` |

---

## 10. FALLBACK THEME (styles/globals.css)

This file is NOT the active theme but exists as a reference. It defines a standard shadcn neutral palette.

### Light Mode (:root)

| Token | OKLCH | Hex |
|-------|-------|-----|
| `--background` | `oklch(1 0 0)` | `#ffffff` |
| `--foreground` | `oklch(0.145 0 0)` | `#0a0a0a` |
| `--primary` | `oklch(0.205 0 0)` | `#171717` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `#fafafa` |
| `--secondary` | `oklch(0.97 0 0)` | `#f5f5f5` |
| `--muted` | `oklch(0.97 0 0)` | `#f5f5f5` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#737373` |
| `--accent` | `oklch(0.97 0 0)` | `#f5f5f5` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#e7000b` |
| `--border` | `oklch(0.922 0 0)` | `#e5e5e5` |
| `--input` | `oklch(0.922 0 0)` | `#e5e5e5` |
| `--ring` | `oklch(0.708 0 0)` | `#a1a1a1` |
| `--radius` | `0.625rem` | 10px |

### Dark Mode (.dark)

| Token | OKLCH | Hex |
|-------|-------|-----|
| `--background` | `oklch(0.145 0 0)` | `#0a0a0a` |
| `--foreground` | `oklch(0.985 0 0)` | `#fafafa` |
| `--primary` | `oklch(0.985 0 0)` | `#fafafa` |
| `--primary-foreground` | `oklch(0.205 0 0)` | `#171717` |
| `--secondary` | `oklch(0.269 0 0)` | `#262626` |
| `--muted` | `oklch(0.269 0 0)` | `#262626` |
| `--muted-foreground` | `oklch(0.708 0 0)` | `#a1a1a1` |
| `--destructive` | `oklch(0.396 0.141 25.723)` | `#82181a` |
| `--destructive-foreground` | `oklch(0.637 0.237 25.331)` | `#fb2c36` |
| `--border` | `oklch(0.269 0 0)` | `#262626` |
| `--ring` | `oklch(0.439 0 0)` | `#525252` |
