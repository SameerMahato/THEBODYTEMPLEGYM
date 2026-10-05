/**
 * Composes the shareable "scan to join" poster on a canvas and returns it
 * as a PNG blob.
 *
 * Why canvas rather than a DOM-to-image library: html2canvas and friends are
 * ~200KB of JavaScript to approximate a layout we already control exactly.
 * The poster is a fixed design, so drawing it directly is both smaller and
 * pixel-exact, and it renders at print resolution rather than at whatever
 * size the card happens to occupy on screen.
 *
 * The QR itself is not regenerated. The dashboard renders it to SVG on the
 * server precisely so the QR library never reaches the browser; this
 * serialises that existing SVG into the canvas, so the poster can never
 * disagree with the code on screen.
 */

/** 4:5 — the tallest aspect both Instagram feed and WhatsApp status accept uncropped. */
const W = 1080
const H = 1350

const COLORS = {
  bg: '#080808',
  accent: '#E1FE54',
  textPrimary: '#F2F2F2',
  textSecondary: '#A0A0A0',
  textMuted: '#828282',
  panel: '#FFFFFF',
}

export interface PosterOptions {
  /** The server-rendered QR, read straight out of the page. */
  svg: SVGElement
  /** Large display line, e.g. "BODY TEMPLE". */
  brandPrimary: string
  /** Accent line beneath it, e.g. "GYM". */
  brandSecondary: string
  /** The URL the QR encodes, printed as fallback for anyone who cannot scan. */
  joinUrl: string
  /** Resolved family names — next/font hashes these, so they must be read
   *  from a live element rather than hardcoded. */
  displayFont: string
  bodyFont: string
}

/** Reads the real font families off the page, since next/font generates hashed names. */
export function resolveFonts(el: Element): { displayFont: string; bodyFont: string } {
  const styles = getComputedStyle(el)
  return {
    displayFont: styles.getPropertyValue('--font-display').trim() || 'sans-serif',
    bodyFont: styles.getPropertyValue('--font-body').trim() || 'sans-serif',
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    return
  }
  // Safari < 16 and Firefox < 112.
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Rasterises an inline <svg> element. */
function svgToImage(svg: SVGElement, size: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGElement
  // An SVG without intrinsic dimensions rasterises at 0x0 in Firefox and
  // Safari, so set them explicitly on the clone.
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(size))
  clone.setAttribute('height', String(size))

  const markup = new XMLSerializer().serializeToString(clone)
  // encodeURIComponent rather than btoa: btoa throws on non-Latin-1 input.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not rasterise the QR code'))
    img.src = url
  })
}

/** Draws centred text, shrinking it until it fits within maxWidth. */
function centredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  { weight, size, family, color, tracking = 0, maxWidth = W - 120 }: {
    weight: number; size: number; family: string; color: string
    tracking?: number; maxWidth?: number
  },
) {
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  let px = size
  // letterSpacing is ignored by browsers that do not support it, which only
  // costs us the tracking, not the text.
  ctx.letterSpacing = `${tracking}px`
  ctx.font = `${weight} ${px}px ${family}`
  while (ctx.measureText(text).width > maxWidth && px > 12) {
    px -= 2
    ctx.font = `${weight} ${px}px ${family}`
  }

  ctx.fillText(text, W / 2, y)
  ctx.letterSpacing = '0px'
}

export async function renderJoinPoster(opts: PosterOptions): Promise<Blob> {
  const { svg, brandPrimary, brandSecondary, joinUrl, displayFont, bodyFont } = opts

  // Without this the first render falls back to a system face, because canvas
  // does not trigger font loading the way the layout engine does.
  if (document.fonts?.ready) await document.fonts.ready

  const qrSize = 560
  const qr = await svgToImage(svg, qrSize)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser')

  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  // Accent rules, top and bottom.
  ctx.fillStyle = COLORS.accent
  ctx.fillRect(0, 0, W, 10)
  ctx.fillRect(0, H - 10, W, 10)

  centredText(ctx, brandPrimary, 180, {
    weight: 800, size: 96, family: displayFont, color: COLORS.textPrimary, tracking: 2,
  })
  centredText(ctx, brandSecondary, 245, {
    weight: 600, size: 44, family: displayFont, color: COLORS.accent, tracking: 14,
  })

  // White panel: a QR needs dark-on-light and a quiet zone to scan reliably,
  // so it cannot sit directly on the dark background.
  const panelX = 190
  const panelY = 300
  const panelSize = 700
  ctx.fillStyle = COLORS.panel
  roundedRect(ctx, panelX, panelY, panelSize, panelSize, 32)
  ctx.fill()

  ctx.drawImage(qr, (W - qrSize) / 2, panelY + (panelSize - qrSize) / 2, qrSize, qrSize)

  centredText(ctx, 'SCAN TO JOIN', 1090, {
    weight: 700, size: 54, family: displayFont, color: COLORS.textPrimary, tracking: 8,
  })
  centredText(ctx, joinUrl, 1150, {
    weight: 500, size: 28, family: bodyFont, color: COLORS.textSecondary,
  })
  centredText(ctx, 'Fill in your details, then see the front desk', 1215, {
    weight: 400, size: 24, family: bodyFont, color: COLORS.textMuted,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the poster'))),
      'image/png',
    )
  })
}

/** `body-temple-gym-join-qr.png` */
export function posterFilename(brandName: string): string {
  const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'gym'}-join-qr.png`
}
