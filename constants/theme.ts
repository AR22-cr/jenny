/**
 * Jenny Design System
 * ─────────────────────────────────────────
 * Style: Warm Nordic minimalism meets playful illustration.
 * Think Headspace circa 2018 × Scandinavian health clinic.
 *
 * NOT: Clinical white/blue. NOT AI-gradient purple.
 * NOT Material Design flat. NOT bubbly app-game UI.
 *
 * Feeling: Trustworthy, cozy, slightly whimsical, genuinely premium.
 */

// ─── Color Palette (§1.3) — Flo-inspired warm pink ──────────
export const Colors = {
  midnight: '#0D1B2A',  // Doctor dashboard backgrounds, data-heavy views
  ink: '#2D2D3A',  // Primary text — slightly warmer charcoal
  fog: '#F2F2F7',  // Patient-facing Apple system grey background
  snow: '#FFFFFF',  // Cards, modals — pure white for contrast
  glacier: '#FF6B8A',  // Primary accent — rose pink (CTAs, interactive)
  aurora: '#F5A3B5',  // Warm accent — soft pink (secondary highlights)
  moss: '#4CAF7D',  // Positive/green confirmations
  blush: '#E53E6B',  // Alert states, high-concern flags
  slate: '#9E9EA7',  // Secondary text, disabled states
  ice: '#FDEEF1',  // Subtle pink tint backgrounds
} as const;

// ─── Typography (§1.4) ─────────────────────────────────────
// Display: Canela → Playfair Display (closest warm elegant serif available)
// UI Labels: DM Mono
// Body: Lora
export const Fonts = {
  // Display / Hero — elegant serif for headers, creates warmth
  display: 'PlayfairDisplay_400Regular',
  displayBold: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',

  // Body — humanist serif for readable body content
  body: 'Lora_400Regular',
  bodyItalic: 'Lora_400Regular_Italic',
  bodyBold: 'Lora_700Bold',

  // UI Labels & Navigation — grounded clinical-but-friendly mono
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;

// All sizes on 8pt grid (§1.4)
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,  // Body minimum for patient app
  md: 20,  // Question text minimum size
  lg: 24,  // Question text Canela size
  xl: 32,
  '2xl': 40,
  '3xl': 48,  // Welcome screen "Meet Pip."
  '4xl': 56,  // Scale 10 big number
} as const;

export const LineHeights = {
  display: 1.1,
  body: 1.5,
} as const;

export const LetterSpacing = {
  caps: 0.04,  // em — all-caps labels
  mono: 0.02,  // em — DM Mono body
} as const;

// ─── Spacing (8pt grid) ────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 56,
  '5xl': 72,
} as const;

// ─── Border Radii (§5.2) ───────────────────────────────────
// Cards: 20px, Primary buttons: 28px
export const Radii = {
  sm: 8,
  md: 12,  // multi_choice option pills
  lg: 22,  // Cards — Apple widget radius
  xl: 28,  // Primary buttons
  widget: 22,  // iOS widget card radius
  full: 999,  // Pills / circles
} as const;

// ─── Shadows ───────────────────────────────────────────────
// Depth through layered transparency, not heavy drop shadows (§1.7)
export const Shadows = {
  card: {
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

// ─── Animation (§1.6) ──────────────────────────────────────
// Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — slightly springy, never bouncy
export const Animation = {
  micro: 120,   // ms
  standard: 240,
  deliberate: 400,
  spring: {
    damping: 20,
    stiffness: 180,
  },
} as const;

// ─── Touch Targets (§5.2) ──────────────────────────────────
// Min 56px for patient app
export const TouchTarget = {
  min: 56,
} as const;
