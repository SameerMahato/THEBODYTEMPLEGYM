/**
 * Responsive breakpoints.
 *
 * CSS media queries cannot read custom properties — `@media (max-width: var(--x))`
 * is not valid CSS — so the pixel values are necessarily written out in
 * styles/tokens.css as well. This module is the canonical definition and the
 * one place to change them; the CSS carries a comment pointing here.
 *
 * Layout is done in CSS. Do not branch on these in React to pick a layout:
 * reading window.innerWidth forces the component client-side, renders the
 * wrong thing on the server, and flickers on load.
 */

export const breakpoints = {
  /** Phones. Below this is the single-column, purpose-built mobile layout. */
  mobile: 640,
  /** Tablets. At and above this the sidebar and multi-column layouts appear. */
  tablet: 768,
  /** Laptops. Full desktop layout. */
  desktop: 1024,
  /** Large displays. */
  wide: 1280,
} as const

export type Breakpoint = keyof typeof breakpoints

/**
 * Ready-made query strings, for the rare case something genuinely needs to
 * match in JS — a `matchMedia` listener for behaviour, never for layout.
 */
export const media = {
  belowTablet: `(max-width: ${breakpoints.tablet - 1}px)`,
  tabletOnly: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  tabletUp: `(min-width: ${breakpoints.tablet}px)`,
  desktopUp: `(min-width: ${breakpoints.desktop}px)`,
} as const
