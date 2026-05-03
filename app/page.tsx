"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase-browser"

type Status = "saved" | "applied" | "interviewing" | "offer" | "rejected"

const statusMap: Record<Status, string> = {
  saved:        "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]",
  applied:      "bg-[oklch(0.46_0.12_228/0.14)] text-[var(--info)]    border-[oklch(0.46_0.12_228/0.50)]",
  interviewing: "bg-[oklch(0.56_0.19_34/0.14)]  text-[var(--accent)]  border-[oklch(0.56_0.19_34/0.55)]",
  offer:        "bg-[oklch(0.50_0.14_152/0.18)] text-[var(--success)] border-[oklch(0.50_0.14_152/0.55)]",
  rejected:     "bg-[oklch(0.52_0.22_26/0.14)]  text-[var(--danger)]  border-[oklch(0.52_0.22_26/0.50)]",
}

const dotColor: Record<Status, string> = {
  saved:        "var(--muted-foreground)",
  applied:      "var(--info)",
  interviewing: "var(--accent)",
  offer:        "var(--success)",
  rejected:     "var(--danger)",
}

const HEADLINES = [
  { before: "A quieter way to ",      italic: "track",         after: " the work that finds you." },
  { before: "Stop guessing. Start ",  italic: "knowing",       after: " if you're a fit."         },
  { before: "Every application, ",    italic: "organised",     after: " and analysed."            },
  { before: "Your job search, finally ", italic: "under control", after: "."                      },
]

const categoryMeta = {
  technical:    { label: "Technical",    color: "var(--info)"    },
  behavioural:  { label: "Behavioural",  color: "var(--accent)"  },
  role_specific:{ label: "Role-specific",color: "var(--success)" },
}

function InterviewPrepPanel({ job, onClose }: { job: any; onClose: () => void }) {
  const [questions, setQuestions]   = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState("")
  const [openAnswers, setOpenAnswers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/interview-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobText: job.job_text, role: job.role, company: job.company }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setQuestions(data)
        setLoading(false)
      })
      .catch(() => { setError("Something went wrong"); setLoading(false) })
  }, [job.id])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="overlay-fade-in absolute inset-0"
        style={{background:"oklch(0.10 0.01 58 / 0.30)", backdropFilter:"blur(4px)"}}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="panel-slide-in relative flex h-full w-full max-w-lg flex-col overflow-hidden"
        style={{background:"var(--background)", borderLeft:"1px solid var(--border)", boxShadow:"var(--shadow-lg)"}}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-8 py-6"
             style={{borderBottom:"1px solid var(--border)", background:"var(--background)"}}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--accent)"}}>Interview prep</p>
            <h2 className="mt-1 font-display text-2xl font-light tracking-tight">{job.role}</h2>
            <p className="font-mono text-xs uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>· {job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="mt-1 rounded-lg p-2 transition-opacity hover:opacity-60"
            style={{color:"var(--muted-foreground)"}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading && (
            <div className="flex items-center gap-3 py-12 font-mono text-sm" style={{color:"var(--muted-foreground)"}}>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
              Generating questions…
            </div>
          )}
          {error && (
            <p className="rounded-lg px-4 py-3 font-mono text-xs" style={{background:"oklch(0.52 0.22 26 / 0.08)",color:"var(--danger)"}}>
              {error}
            </p>
          )}
          {questions && (
            <div className="space-y-8">
              {(["technical","behavioural","role_specific"] as const).map(cat => {
                const items: {question: string, answer: string}[] = questions[cat] ?? []
                if (!items.length) return null
                const meta = categoryMeta[cat]
                return (
                  <div key={cat}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-px flex-1" style={{background:"var(--border)"}}/>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{color: meta.color}}>
                        {meta.label}
                      </span>
                      <span className="rounded-full px-2 py-0.5 font-mono text-[9px]"
                            style={{background:"var(--secondary)",color:"var(--muted-foreground)"}}>
                        {items.length}
                      </span>
                      <span className="h-px flex-1" style={{background:"var(--border)"}}/>
                    </div>
                    <ol className="space-y-5">
                      {items.map((item, i) => {
                        const key = `${cat}-${i}`
                        const isOpen = openAnswers[key]
                        const q = typeof item === "string" ? item : item.question
                        const a = typeof item === "string" ? null : item.answer
                        return (
                          <li key={i} className="flex gap-4">
                            <span className="mt-0.5 font-mono text-[10px] shrink-0 tabular-nums" style={{color: meta.color, opacity:0.7}}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed" style={{color:"var(--foreground)"}}>{q}</p>
                              {a && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => setOpenAnswers(p => ({ ...p, [key]: !p[key] }))}
                                    className="font-mono text-[10px] uppercase tracking-[0.14em] flex items-center gap-1 transition-opacity hover:opacity-70"
                                    style={{color: meta.color}}
                                  >
                                    <span style={{display:"inline-block", transition:"transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)"}}>▶</span>
                                    {isOpen ? "Hide answer" : "Show answer"}
                                  </button>
                                  {isOpen && (
                                    <p className="mt-2 text-sm leading-relaxed rounded-lg px-4 py-3 animate-fade-in"
                                       style={{background:"var(--secondary)", color:"var(--muted-foreground)", borderLeft:"2px solid "+meta.color}}>
                                      {a}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 font-mono text-[10px] uppercase tracking-[0.18em]"
             style={{borderTop:"1px solid var(--border)", color:"var(--muted-foreground)"}}>
          Questions generated by AI · use as a guide
        </div>
      </div>
    </div>
  )
}

function CoverLetterPanel({ job, onClose }: { job: any; onClose: () => void }) {
  const [letter, setLetter]   = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    fetch("/api/cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobText: job.job_text, role: job.role, company: job.company }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setLetter(data.cover_letter)
        setLoading(false)
      })
      .catch(() => { setError("Something went wrong"); setLoading(false) })
  }, [job.id])

  function copy() {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="overlay-fade-in absolute inset-0"
           style={{background:"oklch(0.10 0.01 58 / 0.30)", backdropFilter:"blur(4px)"}}
           onClick={onClose} />

      <div className="panel-slide-in relative flex h-full w-full max-w-lg flex-col overflow-hidden"
           style={{background:"var(--background)", borderLeft:"1px solid var(--border)", boxShadow:"var(--shadow-lg)"}}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-8 py-6"
             style={{borderBottom:"1px solid var(--border)", background:"var(--background)"}}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--success)"}}>Cover letter</p>
            <h2 className="mt-1 font-display text-2xl font-light tracking-tight">{job.role}</h2>
            <p className="font-mono text-xs uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>· {job.company}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {letter && (
              <button
                onClick={copy}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-all"
                style={{
                  borderColor: copied ? "oklch(0.50 0.14 152 / 0.5)" : "var(--border)",
                  background:  copied ? "oklch(0.50 0.14 152 / 0.10)" : "var(--secondary)",
                  color:       copied ? "var(--success)" : "var(--muted-foreground)",
                }}
              >
                {copied ? (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied</>
                ) : (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
                )}
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-2 transition-opacity hover:opacity-60"
                    style={{color:"var(--muted-foreground)"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading && (
            <div className="flex items-center gap-3 py-12 font-mono text-sm" style={{color:"var(--muted-foreground)"}}>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
              Writing your cover letter…
            </div>
          )}
          {error && (
            <p className="rounded-lg px-4 py-3 font-mono text-xs" style={{background:"oklch(0.52 0.22 26 / 0.08)", color:"var(--danger)"}}>
              {error}
            </p>
          )}
          {letter && (
            <div className="rounded-2xl p-6" style={{background:"var(--gradient-warm)", border:"1px solid var(--border)"}}>
              {letter.split("\n\n").map((para, i) => (
                <p key={i} className={`text-sm leading-relaxed ${i > 0 ? "mt-4" : ""}`} style={{color:"var(--foreground)"}}>
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 font-mono text-[10px] uppercase tracking-[0.18em]"
             style={{borderTop:"1px solid var(--border)", color:"var(--muted-foreground)"}}>
          {!loading && !error && "AI-generated · review before sending"}
          {!loading && !error && !letter && "Upload your CV for a more personalised letter"}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  return (
    <div className="relative inline-flex items-center" data-tooltip="Change application status">
      <span className="pointer-events-none absolute left-3 h-1.5 w-1.5 rounded-full"
            style={{background: dotColor[status]}} />
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as Status)}
        className={`cursor-pointer appearance-none rounded-full border py-1 pl-7 pr-3 font-mono text-[10px] uppercase tracking-[0.18em] outline-none ${statusMap[status]}`}
      >
        {(Object.keys(statusMap) as Status[]).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
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
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({})
  const [prepJob, setPrepJob]             = useState<any>(null)
  const [coverLetterJob, setCoverLetterJob] = useState<any>(null)
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

  async function saveNotes(id: string, notes: string) {
    await fetch("/api/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes }),
    })
    setJobs(prev => prev.map(j => j.id === id ? { ...j, notes } : j))
  }

  async function deleteJob(id: string) {
    await fetch("/api/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchJobs()
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
  const responseRate = applied > 0 ? Math.round((interviewing + offers) / applied * 100) : null

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
              className="font-display text-[2.6rem] font-light leading-[1.05] tracking-tight sm:text-5xl md:text-7xl"
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
              ) : focusJob ? (
                <>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
                       style={{
                         borderColor: focusJob.status === "interviewing" ? "oklch(0.56 0.19 34 / 0.5)" : "oklch(0.46 0.12 228 / 0.45)",
                         background:  focusJob.status === "interviewing" ? "oklch(0.56 0.19 34 / 0.12)" : "oklch(0.46 0.12 228 / 0.12)",
                         color:       focusJob.status === "interviewing" ? "var(--accent)" : "var(--info)",
                       }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current"/>
                    {focusJob.status}
                  </div>
                  <p className="mt-2 font-display text-xl leading-snug">{focusJob.role}</p>
                  <p className="font-mono text-xs uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>· {focusJob.company}</p>
                  <p className="mt-1 font-mono text-[10px]" style={{color:"var(--muted-foreground)"}}>
                    {Math.floor((Date.now() - new Date(focusJob.created_at).getTime()) / 86400000)} days ago
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t pt-4 font-mono text-[11px] uppercase tracking-[0.18em]"
                       style={{borderColor:"var(--border)",color:"var(--muted-foreground)"}}>
                    <span>{total} tracked</span>
                    <span>{interviewing} active</span>
                  </div>
                </>
              ) : result ? (
                <>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>Just analysed</p>
                  <p className="mt-1 font-display text-xl leading-snug">{result.role}</p>
                  <p className="font-mono text-xs uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>· {result.company}</p>
                  <div className="mt-5 flex items-center justify-between border-t pt-4 font-mono text-[11px] uppercase tracking-[0.18em]"
                       style={{borderColor:"var(--border)",color:"var(--muted-foreground)"}}>
                    <span>{total} tracked</span>
                    <span>{interviewing} active</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 font-display text-xl leading-snug">Your next opportunity.</p>
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
          <div className="card-3d overflow-hidden rounded-2xl"
               data-tooltip="Your application pipeline at a glance"
               style={{border:"1px solid var(--border)",background:"var(--card)"}}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              {[
                { label: "Tracked",       display: String(total).padStart(2,"0"),        color: "var(--foreground)" },
                { label: "Applied",       display: String(applied).padStart(2,"0"),      color: "var(--info)"       },
                { label: "Interviewing",  display: String(interviewing).padStart(2,"0"), color: "var(--accent)"     },
                { label: "Offers",        display: String(offers).padStart(2,"0"),       color: "var(--success)"    },
                { label: "Response rate", display: responseRate !== null ? `${responseRate}%` : "—", color: responseRate === null ? "var(--muted-foreground)" : responseRate >= 50 ? "var(--success)" : "var(--warning)" },
              ].map((s) => (
                <div key={s.label} className="p-5 md:p-6"
                     style={{borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)"}}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                    {s.label}
                  </p>
                  <p className="mt-2 font-display text-2xl md:text-3xl font-light tracking-tight" style={{color:s.color}}>
                    {s.display}
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
            <div className="border-b p-6 md:col-span-4 md:border-b-0 md:border-r md:p-8" style={{borderColor:"var(--border)",background:"var(--gradient-warm)"}}>
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
            <div className="p-6 md:col-span-8 md:p-8">
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
            <div className="p-6 md:p-8">
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--accent)"}}>Latest analysis</p>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-light tracking-tight sm:text-3xl">{result.role}</h3>
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
            <ul style={{borderTop:"1px solid var(--border)"}}>
              {[0,1,2].map(i => (
                <li key={i} className="grid grid-cols-12 gap-x-4 gap-y-2 py-6 md:py-8" style={{borderBottom:"1px solid var(--border)"}}>
                  <div className="col-span-2 md:col-span-1 flex items-center">
                    <div className="skeleton h-3 w-5"/>
                  </div>
                  <div className="col-span-2 md:col-span-3 flex items-center">
                    <div className="skeleton h-10 w-10 rounded-xl"/>
                  </div>
                  <div className="col-span-12 md:col-span-6 space-y-2">
                    <div className="skeleton h-6 w-48 rounded-lg"/>
                    <div className="skeleton h-3 w-24 rounded"/>
                    <div className="skeleton h-3 w-full max-w-sm rounded"/>
                    <div className="skeleton h-3 w-4/5 rounded"/>
                    <div className="mt-3 flex gap-2">
                      <div className="skeleton h-5 w-14 rounded-full"/>
                      <div className="skeleton h-5 w-14 rounded-full"/>
                      <div className="skeleton h-5 w-14 rounded-full"/>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-2 flex flex-wrap gap-2 md:flex-col md:items-end">
                    <div className="skeleton h-6 w-24 rounded-full"/>
                    <div className="skeleton h-3 w-20 rounded"/>
                  </div>
                </li>
              ))}
            </ul>
          ) : jobs.length === 0 ? (
            <p className="py-12 text-center font-mono text-sm" style={{color:"var(--muted-foreground)"}}>No applications yet. Paste a job above.</p>
          ) : (
            <ul style={{borderTop:"1px solid var(--border)"}}>
              {jobs.map((job, idx) => (
                <li key={job.id}

                    className="job-row group grid grid-cols-12 gap-x-4 gap-y-2 py-6 md:py-8"
                    style={{borderBottom:"1px solid var(--border)"}}>
                  <div className="col-span-2 flex items-center md:col-span-1">
                    <span className="font-mono text-xs" style={{color:"var(--muted-foreground)"}}>{String(idx+1).padStart(2,"0")}</span>
                  </div>
                  <div className="col-span-2 flex items-center md:col-span-3 md:block">
                    <ScoreBadge score={job.match_score} size="sm" />
                  </div>
                  <div className="col-span-12 md:col-span-6 md:col-start-5">
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

                    {/* Action buttons row */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setPrepJob(job)}
                        data-tooltip="Get AI-generated interview questions for this role"
                        className="group font-mono text-[10px] uppercase tracking-[0.14em] rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-all"
                        style={{
                          border: "1px solid oklch(0.60 0.12 228 / 0.45)",
                          background: "oklch(0.92 0.06 228 / 0.55)",
                          color: "oklch(0.35 0.13 228)"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.86 0.09 228 / 0.7)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.92 0.06 228 / 0.55)")}
                      >
                        <span>⚡</span> Prep
                      </button>
                      <button
                        onClick={() => setCoverLetterJob(job)}
                        data-tooltip="Generate a personalised cover letter using your CV"
                        className="font-mono text-[10px] uppercase tracking-[0.14em] rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-all"
                        style={{
                          border: "1px solid oklch(0.62 0.14 48 / 0.45)",
                          background: "oklch(0.93 0.06 48 / 0.55)",
                          color: "oklch(0.38 0.14 38)"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.87 0.09 48 / 0.7)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.93 0.06 48 / 0.55)")}
                      >
                        <span>✉</span> Cover letter
                      </button>
                    </div>

                    {/* Notes */}
                    <div className="mt-4">
                      {notesOpen[job.id] ? (
                        <div>
                          <textarea
                            id={`note-${job.id}`}
                            defaultValue={job.notes ?? ""}
                            placeholder="Notes…"
                            rows={2}
                            className="w-full resize-none rounded-lg px-3 py-2 text-sm leading-relaxed outline-none transition-colors"
                            style={{
                              border: "1px solid var(--border)",
                              background: "var(--background)",
                              color: "var(--foreground)",
                            }}
                          />
                          <div className="mt-1.5 flex gap-2">
                            <button
                              onClick={() => {
                                const el = document.getElementById(`note-${job.id}`) as HTMLTextAreaElement
                                saveNotes(job.id, el.value)
                                setNotesOpen(p => ({ ...p, [job.id]: false }))
                              }}
                              className="font-mono text-[10px] uppercase tracking-[0.14em] rounded-full px-3 py-1 transition-opacity hover:opacity-80"
                              style={{ background: "var(--accent)", color: "oklch(0.98 0.01 80)" }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setNotesOpen(p => ({ ...p, [job.id]: false }))}
                              className="font-mono text-[10px] uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : job.notes ? (
                        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1"
                             style={{ border: "1px solid oklch(0.56 0.19 34 / 0.35)", background: "oklch(0.56 0.19 34 / 0.06)" }}>
                          <span className="text-xs" style={{ color: "var(--foreground)" }}>{job.notes}</span>
                          <button
                            onClick={() => setNotesOpen(p => ({ ...p, [job.id]: true }))}
                            className="font-mono text-[11px] shrink-0 transition-opacity hover:opacity-70"
                            style={{ color: "var(--accent)" }}
                          >
                            ✎
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setNotesOpen(p => ({ ...p, [job.id]: true }))}
                          className="font-mono text-[10px] uppercase tracking-[0.18em] transition-opacity hover:opacity-70"
                          style={{
                            color: "var(--accent)",
                            textDecoration: "underline",
                            textDecorationStyle: "dashed",
                            textUnderlineOffset: "3px"
                          }}
                        >
                          + Add note
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-span-12 flex flex-wrap items-center gap-2 md:col-span-2 md:flex-col md:items-end md:justify-start">
                    <StatusPill status={job.status as Status} onChange={(s) => updateStatus(job.id, s)} />
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                      {new Date(job.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                    </span>
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="rounded-full px-2.5 py-1.5 transition-opacity hover:opacity-80"
                      style={{
                        border: "1px solid oklch(0.65 0.18 26 / 0.35)",
                        background: "oklch(0.95 0.05 26 / 0.5)",
                        color: "oklch(0.48 0.20 26)"
                      }}
                      title="Delete"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {prepJob && <InterviewPrepPanel job={prepJob} onClose={() => setPrepJob(null)} />}
        {coverLetterJob && <CoverLetterPanel job={coverLetterJob} onClose={() => setCoverLetterJob(null)} />}

        <footer className="mt-24 border-t pt-8" style={{borderColor:"var(--border)"}}>
          <p className="font-display text-sm italic text-center" style={{color:"var(--muted-foreground)"}}>"The work you want is already looking for you."</p>
        </footer>
      </div>
    </main>
  )
}
