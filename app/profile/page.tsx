"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"upload" | "manual">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [skills, setSkills] = useState("")
  const [expLevel, setExpLevel] = useState("mid")
  const [targetRoles, setTargetRoles] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        if (data) {
          setProfile(data)
          setSkills(data.skills?.join(", ") ?? "")
          setExpLevel(data.experience_level ?? "mid")
          setTargetRoles(data.target_roles ?? "")
        }
        setLoading(false)
      })
  }, [])

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError("")
    setSuccess("")
    const form = new FormData()
    form.append("cv", file)
    const res = await fetch("/api/profile/cv", { method: "POST", body: form })
    const data = await res.json()
    if (data.error) { setError(data.error) }
    else {
      setProfile(data)
      setSkills(data.skills?.join(", ") ?? "")
      setExpLevel(data.experience_level ?? "mid")
      setTargetRoles(data.target_roles ?? "")
      setSuccess("CV processed and profile saved.")
      setFile(null)
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess("")
    const skillsArr = skills.split(",").map((s: string) => s.trim()).filter(Boolean)
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills: skillsArr, experience_level: expLevel, target_roles: targetRoles }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error) }
    else { setProfile(data); setSuccess("Profile saved.") }
    setSaving(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <main className="min-h-screen" style={{backgroundColor:"var(--background)",color:"var(--foreground)"}}>

      {/* Header */}
      <header style={{borderBottom:"1px solid var(--border)"}}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="grain flex h-9 w-9 items-center justify-center rounded-md text-white transition-opacity hover:opacity-80" style={{background:"var(--gradient-ink)"}}>
              <span className="font-display text-base leading-none">J</span>
            </Link>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
              <Link href="/" className="transition-opacity hover:opacity-70">Dashboard</Link>
              <span>/</span>
              <span style={{color:"var(--foreground)"}}>Profile</span>
            </div>
          </div>
          <button onClick={signOut} className="rounded-full border px-4 py-2 text-xs font-medium tracking-wide transition-opacity hover:opacity-70" style={{borderColor:"var(--border)",background:"var(--card)"}}>
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:px-10 md:pt-16">

        {/* Title */}
        <div className="mb-10 animate-float-up">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{color:"var(--muted-foreground)"}}>
            <span className="h-px w-8 inline-block mr-3 align-middle" style={{background:"var(--foreground)",opacity:0.3}}/>
            Your profile
          </p>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tight md:text-5xl">
            Make the match <em style={{color:"var(--accent)"}}>personal.</em>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed" style={{color:"var(--muted-foreground)"}}>
            Upload your CV or describe your skills — we'll use this to personalise every job analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">

          {/* Left — update form */}
          <div className="md:col-span-7">
            <div className="overflow-hidden rounded-3xl" style={{border:"1px solid var(--border)",background:"var(--card)",boxShadow:"var(--shadow-md)"}}>

              {/* Tabs */}
              <div className="flex border-b" style={{borderColor:"var(--border)"}}>
                {(["upload", "manual"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 py-4 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors"
                    style={{
                      color: tab === t ? "var(--foreground)" : "var(--muted-foreground)",
                      borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                      background: tab === t ? "var(--secondary)" : "transparent",
                    }}
                  >
                    {t === "upload" ? "Upload CV" : "Manual entry"}
                  </button>
                ))}
              </div>

              <div className="p-8">
                {tab === "upload" ? (
                  <div className="space-y-5">
                    <p className="text-sm leading-relaxed" style={{color:"var(--muted-foreground)"}}>
                      Upload a PDF of your CV and we'll automatically extract your skills, experience level, and target roles.
                    </p>

                    {/* Drop zone */}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full rounded-2xl border-2 border-dashed py-8 text-center transition-colors"
                      style={{
                        borderColor: file ? "var(--accent)" : "var(--border)",
                        background: file ? "oklch(0.56 0.19 34 / 0.04)" : "var(--background)",
                      }}
                    >
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{color: file ? "var(--accent)" : "var(--muted-foreground)"}}>
                        {file ? `✓ ${file.name}` : "Click to select your CV"}
                      </p>
                      {!file && <p className="mt-2 text-xs leading-relaxed" style={{color:"var(--muted-foreground)"}}>PDF only · max 4 MB</p>}
                    </button>

                    {/* Format guidance */}
                    <div className="rounded-xl px-4 py-3 text-xs leading-relaxed space-y-1"
                         style={{background:"var(--secondary)",color:"var(--muted-foreground)"}}>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2" style={{color:"var(--foreground)",opacity:0.6}}>Requirements</p>
                      <p>· <strong>Format:</strong> PDF only (.pdf)</p>
                      <p>· <strong>Text-based:</strong> must have selectable text — not a scanned image or photo of a CV</p>
                      <p>· <strong>Size:</strong> under 4 MB</p>
                      <p>· <strong>Tip:</strong> export from Word, Google Docs, or Notion as PDF for best results</p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] ?? null)}
                    />

                    <button
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className="inline-flex items-center gap-3 rounded-full px-7 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                      style={{background:"var(--gradient-ink)",boxShadow:"var(--shadow-md)"}}
                    >
                      {uploading ? (
                        <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/><span>Extracting…</span></>
                      ) : "Extract with AI →"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                        Skills <span style={{opacity:0.5}}>(comma separated)</span>
                      </label>
                      <textarea
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                        placeholder="React, TypeScript, Node.js, PostgreSQL…"
                        rows={3}
                        className="w-full resize-none rounded-lg px-3.5 py-2.5 text-sm outline-none"
                        style={{border:"1px solid var(--border)",background:"var(--background)",color:"var(--foreground)"}}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                        Experience level
                      </label>
                      <select
                        value={expLevel}
                        onChange={e => setExpLevel(e.target.value)}
                        className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none appearance-none"
                        style={{border:"1px solid var(--border)",background:"var(--background)",color:"var(--foreground)"}}
                      >
                        {["junior","mid","senior","lead"].map(l => (
                          <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>
                        Target roles
                      </label>
                      <input
                        type="text"
                        value={targetRoles}
                        onChange={e => setTargetRoles(e.target.value)}
                        placeholder="Frontend Developer, Full-stack Engineer…"
                        className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                        style={{border:"1px solid var(--border)",background:"var(--background)",color:"var(--foreground)"}}
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving || !skills.trim()}
                      className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                      style={{background:"var(--gradient-ink)",boxShadow:"var(--shadow-md)"}}
                    >
                      {saving ? "Saving…" : "Save profile →"}
                    </button>
                  </div>
                )}

                {error && (
                  <p className="mt-4 rounded-lg px-3.5 py-2.5 font-mono text-[11px]" style={{background:"oklch(0.52 0.22 26 / 0.08)",color:"var(--danger)",border:"1px solid oklch(0.52 0.22 26 / 0.2)"}}>
                    {error}
                  </p>
                )}
                {success && (
                  <p className="mt-4 rounded-lg px-3.5 py-2.5 font-mono text-[11px]" style={{background:"oklch(0.50 0.14 152 / 0.08)",color:"var(--success)",border:"1px solid oklch(0.50 0.14 152 / 0.2)"}}>
                    {success}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right — current profile */}
          <div className="md:col-span-5">
            {loading ? (
              <p className="font-mono text-sm" style={{color:"var(--muted-foreground)"}}>Loading…</p>
            ) : profile ? (
              <div className="rounded-3xl p-7" style={{border:"1px solid var(--border)",background:"var(--gradient-warm)",boxShadow:"var(--shadow-sm)"}}>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--muted-foreground)"}}>Current profile</p>

                <div className="mt-4 inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]" style={{borderColor:"var(--border)",background:"var(--card)",color:"var(--accent)"}}>
                  {profile.experience_level}
                </div>

                <p className="mt-4 text-sm leading-relaxed" style={{color:"var(--foreground)",opacity:0.8}}>
                  {profile.cv_summary}
                </p>

                {profile.skills?.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((s: string) => (
                        <span key={s} className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{borderColor:"var(--border)",background:"var(--card)",color:"var(--muted-foreground)"}}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.target_roles && (
                  <div className="mt-5 border-t pt-4" style={{borderColor:"var(--border)"}}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{color:"var(--muted-foreground)"}}>Target roles</p>
                    <p className="mt-1 text-sm" style={{color:"var(--foreground)"}}>{profile.target_roles}</p>
                  </div>
                )}

                <p className="mt-5 font-mono text-[10px]" style={{color:"var(--muted-foreground)"}}>
                  Updated {new Date(profile.updated_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                </p>
              </div>
            ) : (
              <div className="rounded-3xl p-7" style={{border:"1px dashed var(--border)",background:"transparent"}}>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{color:"var(--muted-foreground)"}}>No profile yet</p>
                <p className="mt-3 text-sm leading-relaxed" style={{color:"var(--muted-foreground)"}}>
                  Upload your CV or fill in your skills manually. Your profile is used to personalise job match scores.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
