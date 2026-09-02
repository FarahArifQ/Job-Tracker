import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobText, role, company } = await request.json()
  if (!jobText?.trim()) return Response.json({ error: 'Job text required' }, { status: 400 })

  const prompt = `You are an interview coach. Based on the job posting below, generate interview questions and model answers for the role of ${role} at ${company}.

Return a JSON object with exactly these fields:
- technical: array of {question: string, answer: string} (3-4 technical questions with concise model answers)
- behavioural: array of {question: string, answer: string} (3 behavioural questions in STAR format style, with a sample STAR answer)
- role_specific: array of {question: string, answer: string} (3 questions specific to the seniority/team/company, with strong model answers)

Make questions and answers specific to this job — not generic. Answers should be 3-5 sentences. Return ONLY valid JSON, no markdown.

Job posting:
${jobText}`

  const geminiRes = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })

  if (!geminiRes.ok) {
    return Response.json({ error: 'Failed to generate questions' }, { status: 502 })
  }

  const geminiData = await geminiRes.json()
  const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    return Response.json(JSON.parse(cleaned))
  } catch {
    return Response.json({ error: 'Failed to parse questions' }, { status: 500 })
  }
}
