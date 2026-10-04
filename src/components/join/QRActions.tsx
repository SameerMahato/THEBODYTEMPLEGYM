'use client'

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { appConfig } from '@/config/app'
import { renderJoinPoster, resolveFonts, posterFilename } from '@/lib/qr-poster'

/** The dashboard wraps its server-rendered QR in this id. */
const QR_CONTAINER_ID = 'join-qr'

type Busy = 'share' | 'download' | null

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revoking immediately cancels the download in Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export default function QRActions({ joinUrl }: { joinUrl: string }) {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<Busy>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** The poster only depends on joinUrl, so it is built at most once. */
  const posterRef = useRef<Blob | null>(null)

  const filename = posterFilename(appConfig.brand.name)

  async function buildPoster(): Promise<Blob> {
    if (posterRef.current) return posterRef.current

    const container = document.getElementById(QR_CONTAINER_ID)
    const svg = container?.querySelector('svg')
    if (!svg) throw new Error('Could not find the QR code on the page')

    const { displayFont, bodyFont } = resolveFonts(container!)
    const blob = await renderJoinPoster({
      svg,
      brandPrimary: appConfig.brand.displayPrimary,
      brandSecondary: appConfig.brand.displaySecondary,
      joinUrl,
      displayFont,
      bodyFont,
    })
    posterRef.current = blob
    return blob
  }

  async function sharePoster() {
    setBusy('share'); setError(null); setStatus(null)
    try {
      const blob = await buildPoster()
      const file = new File([blob], filename, { type: 'image/png' })

      // Web Share Level 2. Absent on most desktop browsers, so fall back to
      // a download rather than leaving the button doing nothing.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Join ${appConfig.brand.name}`,
          text: `Scan to join ${appConfig.brand.name} — ${joinUrl}`,
        })
        setStatus('Shared')
      } else {
        triggerDownload(blob, filename)
        setStatus('Sharing is not available in this browser — poster downloaded instead')
      }
    } catch (e) {
      // The user dismissing the share sheet is not a failure.
      if ((e as Error)?.name === 'AbortError') return
      setError((e as Error)?.message ?? 'Could not share the poster')
    } finally {
      setBusy(null)
    }
  }

  async function downloadPoster() {
    setBusy('download'); setError(null); setStatus(null)
    try {
      triggerDownload(await buildPoster(), filename)
      setStatus('Poster downloaded')
    } catch (e) {
      setError((e as Error)?.message ?? 'Could not create the poster')
    } finally {
      setBusy(null)
    }
  }

  function shareOnWhatsApp() {
    const text = `Join ${appConfig.brand.name} — register here: ${joinUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — your browser blocked clipboard access')
    }
  }

  const full = { width: '100%', justifyContent: 'flex-start' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <Button
        variant="primary"
        onClick={sharePoster}
        loading={busy === 'share'}
        loadingLabel="Preparing poster…"
        style={full}
      >
        <Icon.Share />
        Share QR Poster
      </Button>

      <Button
        variant="secondary"
        onClick={downloadPoster}
        loading={busy === 'download'}
        loadingLabel="Preparing poster…"
        style={full}
      >
        <Icon.Download />
        Download Poster (PNG)
      </Button>

      <Button
        variant="secondary"
        onClick={shareOnWhatsApp}
        style={{ ...full, color: 'var(--whatsapp)', borderColor: 'var(--whatsapp)' }}
      >
        <Icon.WhatsApp />
        Send Link on WhatsApp
      </Button>

      {/* WhatsApp's deep link carries text only — there is no API to attach
          an image — so this sends the join link. Use Share above to send the
          poster itself. */}
      <p style={{
        margin: '-2px 0 6px', fontSize: '11px', lineHeight: 1.5,
        color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
      }}>
        WhatsApp links can only carry text. To send the poster image, use
        Share above.
      </p>

      <div style={{ height: '1px', background: 'var(--border)', margin: '2px 0 8px' }} />

      <Button variant="secondary" onClick={() => window.print()} style={full}>
        <Icon.Print />
        Print QR Card
      </Button>

      <Button
        variant="secondary"
        onClick={copyLink}
        style={{ ...full, ...(copied ? { color: 'var(--whatsapp)', borderColor: 'var(--whatsapp)' } : {}) }}
      >
        {copied ? <Icon.Check /> : <Icon.Copy />}
        {copied ? 'Copied!' : 'Copy Join Link'}
      </Button>

      <a href={joinUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <Button variant="secondary" style={full}>
          <Icon.External />
          Open Join Page
        </Button>
      </a>

      {(status || error) && (
        <p
          role="status"
          style={{
            margin: '4px 0 0', fontSize: '12px', lineHeight: 1.5,
            fontFamily: 'var(--font-body)',
            color: error ? 'var(--danger)' : 'var(--text-secondary)',
          }}
        >
          {error ?? status}
        </p>
      )}
    </div>
  )
}

const svgProps = {
  width: 14, height: 14, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  style: { flexShrink: 0 },
} as const

const Icon = {
  Share: () => (
    <svg {...svgProps}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  Download: () => (
    <svg {...svgProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  WhatsApp: () => (
    <svg {...svgProps} strokeWidth={1.8}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8.6 9.2c0 3 2.2 5.2 5.2 5.2l1-1 1.6 1-.6 1.2c-2.6.6-6.4-2.1-7.4-4.8l1.2-.6 1 1.6z" />
    </svg>
  ),
  Print: () => (
    <svg {...svgProps}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Copy: () => (
    <svg {...svgProps}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg {...svgProps} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  External: () => (
    <svg {...svgProps}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
}
