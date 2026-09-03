import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobText, role, company } = await request.json()
  if (!jobText?.trim()) return Response.json({ error: 'Job text required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cv_summary, skills, experience_level, target_roles')
    .eq('user_id', user.id)
    .single()

  const candidateSection = profile?.cv_summary
    ? `Candidate profile:
- Summary: ${profile.cv_summary}
- Skills: ${profile.skills?.join(', ') ?? 'not specified'}
- Experience level: ${profile.experience_level ?? 'not specified'}
- Target roles: ${profile.target_roles ?? 'not specified'}`
    : `Candidate: an experienced professional applying for this role`

  const prompt = `${candidateSection}

Write a professional, personalised cover letter for the ${role} position at ${company}.

Guidelines:
- 3–4 paragraphs, no more
- Opening paragraph: a strong, specific hook referencing the role and why this candidate is interested
- Middle paragraphs: connect the candidate's actual skills and experience to the specific requirements in the job posting — be concrete, not generic
- Closing paragraph: confident call to action
- Tone: warm and professional, never robotic or template-like
- Start with "Dear Hiring Manager," — do NOT include [Your Name], [Date], or any other placeholders
- Return ONLY the cover letter text — no subject line, no extra commentary

Job posting:
${jobText}`

  const geminiRes = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })

  if (!geminiRes.ok) {
    return Response.json({ error: 'Failed to generate cover letter' }, { status: 502 })
  }

  const geminiData = await geminiRes.json()
  const text: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!text) return Response.json({ error: 'Empty response from AI' }, { status: 500 })
  return Response.json({ cover_letter: text.trim() })
}
