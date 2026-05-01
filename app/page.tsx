"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase-browser"

type Status = "saved" | "applied" | "interviewing" | "offer" | "rejected"

const statusMap: Record<Status, string> = {
  saved:        "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]",
  applied:      "bg-[oklch(0.46_0.12_228/0.10)] text-[var(--info)] border-[oklch(0.46_0.12_228/0.28)]",
  interviewing: "bg-[oklch(0.56_0.19_34/0.10)] text-[var(--accent)] border-[oklch(0.56_0.19_34/0.32)]",
  offer:        "bg-[oklch(0.50_0.14_152/0.10)] text-[var(--success)] border-[oklch(0.50_0.14_152/0.32)]",
  rejected:     "bg-[oklch(0.52_0.22_26/0.10)] text-[var(--danger)] border-[oklch(0.52_0.22_26/0.32)]",
}

const HEADLINES = [
  { before: "A quieter way to ",      italic: "track",         after: " the work that finds you." },
  { before: "Stop guessing. Start ",  italic: "knowing",       after: " if you're a fit."         },
  { before: "Every application, ",    italic: "organised",     after: " and analysed."            },
  { before: "Your job search, finally ", italic: "under control", after: "."                      },
]

function StatusPill({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`inline-flex cursor-pointer appearance-none items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] outline-none ${statusMap[status]}`}
    >
      {(Object.keys(statusMap) as Status[]).map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const color = score >= 7 ? "var(--success)" : score >= 4 ? "var(--warning)" : "var(--danger)"
  if (size === "sm") return (
    <div className="card-3d relative inline-flex h-16 w-16 flex-col items-center justify-center rounded-xl"
         data-tooltip="AI match score out of 10"
         style={{border:"1px solid var(--border)",background:"var(--card)"}}>
      <span className="font-display text-2xl font-light leading-none" style={{color}}>{score}</span>
      <span className="font-mono text-[11px] tracking-widest" style={{color:"var(--muted-foreground)",opacity:0.55}}>/10</span>
    </div>
  )
  return (
    <div className="card-3d inline-flex flex-col items-center justify-center rounded-2xl px-6 py-4"
         data-tooltip="How well this job fits your profile"
         style={{background:"var(--card)",border:"1px solid var(--border)"}}>
      <span className="font-display text-7xl font-light leading-none" style={{color}}>{score}</span>
      <span className="mt-1 font-mono text-sm tracking-[0.22em]" style={{color:"var(--muted-foreground)",opacity:0.5}}>/10</span>
    </div>
  )
}

export default function Home() {
  const [jd, setJd]               = useState("")
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<any>(null)
  const [jobs, setJobs]           = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [user, setUser]           = useState<any>(null)
  const [headlineIdx, setHeadlineIdx]   = useState(0)
  const [headlineFade, setHeadlineFade] = useState(true)
  const router   = useRouter()
  const supabase = createClient()
  const resultRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const t = setInterval(() => {
      setHeadlineFade(false)
      setTimeout(() => {
        setHeadlineIdx(i => (i + 1) % HEADLINES.length)
        setHeadlineFade(true)
      }, 300)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    const res = await fetch("/api/jobs")
    const data = await res.json()
    setJobs(Array.isArray(data) ? data : [])
    setLoadingJobs(false)
  }

  async function analyseJob() {
    if (!jd.trim()) return
    setLoading(true)
    setResult(null)
    const res = await fetch("/api/analyse-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobText: jd }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    setJd("")
    fetchJobs()
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  async function updateStatus(id: string, status: Status) {
    await fetch("/api/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    fetchJobs()
  }

  const total        = jobs.length
  const applied      = jobs.filter(j => j.status === "applied").length
  const interviewing = jobs.filter(j => j.status === "interviewing").length
  const offers       = jobs.filter(j => j.status === "offer").length

  const focusJob = jobs.find(j => j.status === "interviewing" || j.status === "applied")
  const hl = HEADLINES[headlineIdx]

  return (
    <main className="min-h-screen" style={{color:"var(--foreground)"}}>

      {/* Loading toast */}
      {loading && (
        <div className="animate-slide-down fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 py-3 font-mono text-xs text-white"
             style={{background:"var(--gradient-ink)"}}>
          <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white"/>
          Analysing your job description — results will appear below
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{borderBottom:"1px solid var(--border)",background:"oklch(0.97 0.015 82 / 0.75)"}}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <div className="grain flex h-9 w-9 items-center justify-center rounded-md text-white" style={{background:"var(--gradient-ink)"}}>
              <span className="font-display text-base leading-none">J</span>
            </div>
            <span className="font-display text-lg tracking-tight">JobTracker</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] sm:block" style={{color:"var(--muted-foreground)"}}>
                {user.email}
              </span>
            )}
            <Link href="/profile"
                  data-tooltip="Update your CV and skills"
                  className="rounded-full border px-4 py-2 text-xs font-medium tracking-wide transition-opacity hover:opacity-70"
                  style={{borderColor:"var(--border)",background:"var(--card)"}}>
              Profile
            </Link>
            <button onClick={signOut} className="rounded-full border px-4 py-2 text-xs font-medium tracking-wide transition-opacity hover:opacity-70"
                    style={{borderColor:"var(--border)",background:"var(--card)"}}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:px-10 md:pt-20">

        {/* Hero */}
        <section className="animate-float-up grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <h1
              className="font-display text-5xl font-light leading-[1.02] tracking-tight md:text-7xl"
              style={{textWrap:"balance", transition:"opacity 0.3s ease", opacity: headlineFade ? 1 : 0}}
            >
              {hl.before}
              <em className="wobble-word not-italic" style={{color:"var(--accent)", fontStyle:"italic"}}>
                {hl.italic}
              </em>
              {hl.after}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed md:text-lg" style={{color:"var(--muted-foreground)"}}>
              Paste a job description. Let the system surface what matters — and keep every application close at hand.
            </p>
          </div>

          {/* Current focus card */}
          <aside className="md:col-span-4 md:pt-2">
            <div className="card-3d rounded-2xl p-6"
                 data-tooltip="Your current job search focus"
                 style={{border:"1px solid var(--border)",background:"var(--card)"}}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--muted-foreground)"}}>Current focus</p>

              {!loadingJobs && jobs.length === 0 ? (
                <>
                  <p className="mt-3 font-display text-xl leading-snug">Welcome to JobTracker</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{color:"var(--muted-foreground)"}}>
                    Paste any job description below to get started. AI will analyse your fit, extract required skills, and flag red flags — in seconds.
                  </p>
                  <p className="mt-4 text-center text-xl animate-bounce" style={{color:"var(--accent)"}}>↓</p>
                </>
              ) : (
                <>
                  <p className="mt-3 font-display text-xl leading-snug">
                    {result
                      ? `${result.role} at ${result.company}`
                      : focusJob
                        ? `${focusJob.role} at ${focusJob.company}`
                        : "Your next opportunity."}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t pt-4 font-mono text-[11px] uppercase tracking-[0.18em]"
                       style={{borderColor:"var(--border)",color:"var(--muted-foreground)"}}>
                    <span>{total} tracked</span>
                    <span>{interviewing} active</span>
                  </div>
                </>
              )}
            </div>
          </aside>
        </section>

        {/* Stats — single card with dividers */}
        <section className="mt-16">
          <div className="card-3d rounded-2xl"
               data-tooltip="Your application pipeline at a glance"
               style={{border:"1px solid var(--border)",background:"var(--card)"}}>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {([
                { label: "Tracked",      value: total,        color: "var(--foreground)", br: "border-r border-b md:border-b-0" },
                { label: "Applied",      value: applied,      color: "var(--info)",        br: "border-b md:border-b-0 md:border-r" },
                { label: "Interviewing", value: interviewing, color: "var(--accent)",      br: "border-r" },
                { label: "Offers",       value: offers,       color: "var(--success)",     br: "" },
              ] as const).map((s) => (
                <div key={s.label} className={`p-6 ${s.br}`} style={{borderColor:"var(--border)"}}>
                  <p className="font-mono text-sm uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                    {s.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-light tracking-tight" style={{color:s.color}}>
                    {String(s.value).padStart(2, "0")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Onboarding banner — only shown when no jobs yet */}
        {!loadingJobs && jobs.length === 0 && (
          <div className="mt-6 rounded-2xl border-2 border-dashed px-6 py-4 text-center"
               style={{borderColor:"var(--border)"}}>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
              You have no applications yet — paste a job description below to analyse your first one.
            </p>
          </div>
        )}

        {/* Analyse */}
        <section className="mt-10 overflow-hidden rounded-3xl card-3d"
                 data-tooltip="Paste a job description for an instant AI fit analysis"
                 style={{border:"1px solid var(--border)",background:"var(--card)"}}>
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="border-b p-8 md:col-span-4 md:border-b-0 md:border-r" style={{borderColor:"var(--border)",background:"var(--gradient-warm)"}}>
              <h2 className="font-display text-3xl font-light leading-tight tracking-tight">Analyse a listing</h2>
              <p className="mt-4 text-sm leading-relaxed" style={{color:"var(--foreground)",opacity:0.7}}>
                Paste any job description. We'll read between the lines — seniority, scope, what they really want.
              </p>
              <div className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em]" style={{color:"var(--foreground)",opacity:0.5}}>
                <div className="flex items-center justify-between">
                  <span>Characters</span>
                  <span>{jd.length}</span>
                </div>
              </div>
            </div>
            <div className="p-8 md:col-span-8">
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyseJob() }}
                placeholder="Paste the full job description here…"
                className="min-h-[180px] w-full resize-none border-0 bg-transparent font-display text-lg leading-relaxed outline-none"
                style={{color:"var(--foreground)"}}
              />
              <div className="mt-6 flex flex-col items-stretch justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center"
                   style={{borderColor:"var(--border)"}}>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em]"
                     style={{color:"var(--muted-foreground)"}}>
                  <kbd className="rounded border px-1.5 py-0.5 text-[10px]" style={{borderColor:"var(--border)",background:"var(--secondary)"}}>Ctrl</kbd>
                  <kbd className="rounded border px-1.5 py-0.5 text-[10px]" style={{borderColor:"var(--border)",background:"var(--secondary)"}}>↵</kbd>
                  <span>to analyse</span>
                </div>
                <button
                  onClick={analyseJob}
                  disabled={loading || !jd.trim()}
                  className="inline-flex items-center justify-center gap-3 rounded-full px-7 py-3 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{background:"var(--gradient-ink)",boxShadow:"var(--shadow-md)"}}
                >
                  {loading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/><span>Analysing…</span></>
                  ) : <><span>Analyse</span><span>→</span></>}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Latest result */}
        {result && (
          <section ref={resultRef} className="mt-8 animate-fade-in overflow-hidden rounded-3xl"
                   data-tooltip="Your most recent AI analysis"
                   style={{border:"1px solid oklch(0.56 0.19 34 / 0.28)",background:"oklch(0.56 0.19 34 / 0.04)",boxShadow:"var(--shadow-glow)"}}>
            <div className="p-8">
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--accent)"}}>Latest analysis</p>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-display text-3xl font-light tracking-tight">{result.role}</h3>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>· {result.company}</p>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed" style={{color:"var(--muted-foreground)"}}>{result.match_reason}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {result.required_skills?.map((s: string) => (
                      <span key={s} className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                            style={{borderColor:"var(--border)",background:"var(--card)",color:"var(--muted-foreground)"}}>{s}</span>
                    ))}
                  </div>
                  {result.red_flags?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {result.red_flags.map((f: string) => (
                        <p key={f} className="text-xs" style={{color:"var(--danger)"}}>⚠ {f}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-center">
                  <ScoreBadge score={result.match_score} />
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                      result.apply_recommendation === "yes"   ? "bg-[oklch(0.50_0.14_152/0.10)] text-[var(--success)] border-[oklch(0.50_0.14_152/0.32)]" :
                      result.apply_recommendation === "maybe" ? "bg-[oklch(0.68_0.14_72/0.10)] text-[var(--warning)] border-[oklch(0.68_0.14_72/0.32)]" :
                      "bg-[oklch(0.52_0.22_26/0.10)] text-[var(--danger)] border-[oklch(0.52_0.22_26/0.32)]"
                    }`}>
                      <span className="h-1 w-1 rounded-full bg-current"/>
                      {result.apply_recommendation === "yes" ? "Apply" : result.apply_recommendation === "maybe" ? "Consider" : "Skip"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Applications */}
        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between border-b pb-4" style={{borderColor:"var(--border)"}}>
            <h2 className="font-display text-3xl font-light tracking-tight">Your applications</h2>
            <span className="font-mono text-xs uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>{total} entries</span>
          </div>

          {loadingJobs ? (
            <p className="py-12 text-center font-mono text-sm" style={{color:"var(--muted-foreground)"}}>Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="py-12 text-center font-mono text-sm" style={{color:"var(--muted-foreground)"}}>No applications yet. Paste a job above.</p>
          ) : (
            <ul style={{borderTop:"1px solid var(--border)"}}>
              {jobs.map((job, idx) => (
                <li key={job.id}
                    data-tooltip={`${job.role} · match score ${job.match_score}/10`}
                    className="grid grid-cols-12 gap-4 py-8 transition-colors hover:bg-[var(--secondary)]/30"
                    style={{borderBottom:"1px solid var(--border)"}}>
                  <div className="col-span-12 flex items-baseline gap-4 md:col-span-1">
                    <span className="font-mono text-xs" style={{color:"var(--muted-foreground)"}}>{String(idx+1).padStart(2,"0")}</span>
                  </div>
                  <div className="col-span-3 hidden md:block">
                    <ScoreBadge score={job.match_score} size="sm" />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-2xl font-normal tracking-tight">{job.role}</h3>
                      <span className="font-mono text-xs uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>· {job.company}</span>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{color:"var(--muted-foreground)"}}>{job.match_reason}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {job.required_skills?.slice(0,5).map((t: string) => (
                        <span key={t} className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                              style={{borderColor:"var(--border)",background:"var(--card)",color:"var(--muted-foreground)"}}>{t}</span>
                      ))}
                      {job.required_skills?.length > 5 && (
                        <span className="font-mono text-[10px]" style={{color:"var(--muted-foreground)"}}>+{job.required_skills.length - 5}</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-12 flex items-start justify-between gap-3 md:col-span-2 md:flex-col md:items-end md:justify-start">
                    <StatusPill status={job.status as Status} onChange={(s) => updateStatus(job.id, s)} />
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                      {new Date(job.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-24 border-t pt-8" style={{borderColor:"var(--border)"}}>
          <p className="font-display text-sm italic text-center" style={{color:"var(--muted-foreground)"}}>"The work you want is already looking for you."</p>
        </footer>
      </div>
    </main>
  )
}
