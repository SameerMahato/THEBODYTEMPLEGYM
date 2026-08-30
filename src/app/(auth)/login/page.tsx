'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '42px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}>
            BODY TEMPLE
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '0.3em',
            color: 'var(--accent)',
            marginTop: '4px',
          }}>
            GYM
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '32px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '24px',
            letterSpacing: '0.05em',
          }}>
            STAFF LOGIN
          </h2>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@bodytemplegym.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <div style={{ minHeight: '44px' }}>
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid var(--danger)',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  color: 'var(--danger)',
                  fontSize: '13px',
                }}>
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--accent-dim)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.08em',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
          Body Temple Gym — Staff Portal
        </p>
      </div>
    </div>
  )
}
