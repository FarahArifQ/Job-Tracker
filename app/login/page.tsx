"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage("Check your email for a confirmation link.")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else { router.push("/"); router.refresh() }
    }
    setLoading(false)
  }

  async function signInWithGoogle() {
    setGoogleLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor:"var(--background)"}}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="grain flex h-10 w-10 items-center justify-center rounded-lg text-white" style={{background:"var(--gradient-ink)"}}>
            <span className="font-display text-lg leading-none">J</span>
          </div>
          <div className="text-center">
            <p className="font-display text-xl tracking-tight">JobTracker</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--muted-foreground)"}}>Edition 04 · 2026</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{border:"1px solid var(--border)",background:"var(--card)",boxShadow:"var(--shadow-lg)"}}>
          <div className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--muted-foreground)"}}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </p>
            <h1 className="mt-2 font-display text-2xl font-light tracking-tight">
              {mode === "login" ? "Sign in to continue" : "Start tracking jobs"}
            </h1>
          </div>

          {/* Google */}
          <button
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-full border py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{borderColor:"var(--border)",background:"var(--card)",color:"var(--foreground)"}}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1" style={{background:"var(--border)"}}/>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>or</span>
            <div className="h-px flex-1" style={{background:"var(--border)"}}/>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                style={{border:"1px solid var(--border)",background:"var(--background)",color:"var(--foreground)"}}
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                style={{border:"1px solid var(--border)",background:"var(--background)",color:"var(--foreground)"}}
              />
            </div>

            {error && (
              <p className="rounded-lg px-3.5 py-2.5 font-mono text-[11px]" style={{background:"oklch(0.52 0.22 26 / 0.08)",color:"var(--danger)",border:"1px solid oklch(0.52 0.22 26 / 0.2)"}}>
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-lg px-3.5 py-2.5 font-mono text-[11px]" style={{background:"oklch(0.50 0.14 152 / 0.08)",color:"var(--success)",border:"1px solid oklch(0.50 0.14 152 / 0.2)"}}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50"
              style={{background:"var(--gradient-ink)",boxShadow:"var(--shadow-md)"}}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <div className="mt-5 border-t pt-5" style={{borderColor:"var(--border)"}}>
            <p className="text-center font-mono text-[11px]" style={{color:"var(--muted-foreground)"}}>
              {mode === "login" ? "No account?" : "Already have one?"}{" "}
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage("") }}
                className="underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{color:"var(--accent)"}}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}
