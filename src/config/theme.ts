/**
 * Typed accessor for the design tokens defined in src/styles/tokens.css.
 *
 * Every value here is a `var(--token)` reference, never a literal. tokens.css
 * stays the single source of truth; this module exists so inline styles get
 * autocomplete and a misspelled token fails at compile time rather than
 * silently rendering as `initial`.
 *
 *   import { theme } from '@/config/theme'
 *   <div style={{ background: theme.color.surface }} />
 *
 * Token names mirror the CSS exactly, so `theme.color.accent` is `--accent`.
 */

export const theme = {
  color: {
    // Surfaces
    bgBase: 'var(--bg-base)',
    bgSurface: 'var(--bg-surface)',
    bgElevated: 'var(--bg-elevated)',
    bgHover: 'var(--bg-hover)',
    border: 'var(--border)',
    borderStrong: 'var(--border-strong)',

    // Text
    text: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    textAccent: 'var(--text-accent)',
    /** Near-black. For text on a filled accent — white fails there. */
    textOnAccent: 'var(--text-on-accent)',

    // Brand and status
    accent: 'var(--accent)',
    accentSurface: 'var(--accent-surface)',
    accentDim: 'var(--accent-dim)',
    accentGlow: 'var(--accent-glow)',
    warning: 'var(--warning)',
    warningDim: 'var(--warning-dim)',
    danger: 'var(--danger)',
    dangerDim: 'var(--danger-dim)',
    success: 'var(--success)',

    /** The deliberately different red used by the adjustment/refund UI. */
    dangerAlt: 'var(--danger-alt)',
    whatsapp: 'var(--whatsapp)',

    // Scrims
    scrimModal: 'var(--scrim-modal)',
    scrimSidebar: 'var(--scrim-sidebar)',
  },

  /**
   * Tints, keyed by opacity: `tint.accent[10]` is the accent at 10% alpha.
   * These replace hand-written rgba() literals, which do not track a change
   * to the brand colour.
   */
  tint: {
    accent: {
      4: 'var(--accent-a04)',
      6: 'var(--accent-a06)',
      7: 'var(--accent-a07)',
      10: 'var(--accent-a10)',
      12: 'var(--accent-a12)',
      15: 'var(--accent-a15)',
      20: 'var(--accent-a20)',
      25: 'var(--accent-a25)',
    },
    danger: {
      4: 'var(--danger-a04)',
      10: 'var(--danger-a10)',
      15: 'var(--danger-a15)',
      30: 'var(--danger-a30)',
      40: 'var(--danger-a40)',
    },
    dangerAlt: {
      4: 'var(--danger-alt-a04)',
      5: 'var(--danger-alt-a05)',
      7: 'var(--danger-alt-a07)',
      10: 'var(--danger-alt-a10)',
      15: 'var(--danger-alt-a15)',
    },
    warning: {
      4: 'var(--warning-a04)',
      10: 'var(--warning-a10)',
      15: 'var(--warning-a15)',
      20: 'var(--warning-a20)',
      30: 'var(--warning-a30)',
    },
    success: {
      10: 'var(--success-a10)',
      20: 'var(--success-a20)',
      40: 'var(--success-a40)',
    },
    whatsapp: {
      4: 'var(--whatsapp-a04)',
      8: 'var(--whatsapp-a08)',
      10: 'var(--whatsapp-a10)',
      15: 'var(--whatsapp-a15)',
      30: 'var(--whatsapp-a30)',
    },
  },

  font: {
    display: 'var(--font-display)',
    body: 'var(--font-body)',
  },

  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    badge: 'var(--badge-radius)',
  },

  shadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },

  space: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    8: 'var(--space-8)',
    10: 'var(--space-10)',
    14: 'var(--space-14)',
  },

  layout: {
    sidebarWidth: 'var(--sidebar-width)',
    pageMaxWidth: 'var(--page-max-width)',
    detailMaxWidth: 'var(--detail-max-width)',
    contentPadY: 'var(--content-pad-y)',
    contentPadX: 'var(--content-pad-x)',
    contentPadMobile: 'var(--content-pad-mobile)',
  },

  component: {
    modalWidthSm: 'var(--modal-width-sm)',
    modalWidthMd: 'var(--modal-width-md)',
    cardPad: 'var(--card-pad)',
  },
} as const

/** Animation durations and easing. Referenced in transition shorthands. */
export const motion = {
  fast: 'var(--motion-fast)',
  normal: 'var(--motion-normal)',
  slow: 'var(--motion-slow)',
  easing: 'var(--ease-standard)',
} as const

export type Theme = typeof theme
