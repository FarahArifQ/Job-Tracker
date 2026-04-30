import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobText } = await request.json()
  if (!jobText?.trim()) {
    return Response.json({ error: 'Job text is required' }, { status: 400 })
  }

  // Fetch user profile for personalised scoring
  const { data: profile } = await supabase
    .from('profiles')
    .select('cv_summary')
    .eq('user_id', user.id)
    .single()

  const candidateContext = profile?.cv_summary
    ? `Candidate profile:\n${profile.cv_summary}`
    : `Candidate: a software developer with general technical skills`

  const prompt = `${candidateContext}

Analyse this job posting for the above candidate and return a JSON object with these exact fields:
- role: string (job title)
- company: string (company name, or "Unknown" if not mentioned)
- match_score: number 1-10 (how well this specific job suits the candidate above)
- match_reason: string (2 sentence explanation referencing the candidate's background)
- required_skills: string[] (list of skills mentioned in the posting)
- red_flags: string[] (concerns about the role, empty array if none)
- apply_recommendation: "yes" | "maybe" | "no"

Return ONLY valid JSON, no markdown, no explanation.

Job posting:
${jobText}`

  const geminiRes = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    console.error('Gemini error:', err)
    return Response.json({ error: 'AI analysis failed' }, { status: 502 })
  }

  const geminiData = await geminiRes.json()
  const rawText: string = geminiData.candidates[0].content.parts[0].text

  let analysis
  try {
    const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    analysis = JSON.parse(cleaned)
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  const { data: saved, error: dbError } = await supabase
    .from('job_applications')
    .insert({
      user_id: user.id,
      job_text: jobText,
      role: analysis.role,
      company: analysis.company,
      match_score: analysis.match_score,
      match_reason: analysis.match_reason,
      required_skills: analysis.required_skills,
      red_flags: analysis.red_flags,
      apply_recommendation: analysis.apply_recommendation,
      status: 'saved',
    })
    .select()
    .single()

  if (dbError) {
    console.error('Supabase save error:', dbError)
    return Response.json(analysis)
  }

  return Response.json({ ...analysis, id: saved.id })
}
