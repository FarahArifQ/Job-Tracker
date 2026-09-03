import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/octet-stream',
  'application/x-pdf',
  'binary/octet-stream',
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('cv') as File | null

  if (!file) {
    return Response.json({ error: 'No file received' }, { status: 400 })
  }

  const isPdf = PDF_MIME_TYPES.has(file.type) || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    return Response.json({ error: 'Please upload a PDF file (.pdf)' }, { status: 400 })
  }

  if (file.size > 4 * 1024 * 1024) {
    return Response.json({ error: 'File is too large — please upload a PDF under 4 MB' }, { status: 400 })
  }

  const pdfBase64 = Buffer.from(await file.arrayBuffer()).toString('base64')

  const prompt = `Analyse this CV/resume and return a JSON object with these exact fields:
- skills: string[] (all technical and professional skills mentioned)
- experience_level: "junior" | "mid" | "senior" | "lead" (based on years and seniority)
- target_roles: string (comma-separated list of job titles this person suits)
- cv_summary: string (2-3 sentence professional summary of the candidate)

Return ONLY valid JSON, no markdown, no explanation.`

  const geminiRes = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
          { text: prompt },
        ],
      }],
    }),
  })

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    console.error('Gemini CV error:', err)
    // Surface a readable message if Gemini explains the problem
    let msg = 'Failed to extract CV data'
    try {
      const parsed = JSON.parse(err)
      if (parsed?.error?.message) msg = parsed.error.message
    } catch { /* ignore */ }
    return Response.json({ error: msg }, { status: 502 })
  }

  const geminiData = await geminiRes.json()
  const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!rawText) {
    return Response.json({ error: 'Gemini returned an empty response — try a text-based PDF (not a scanned image)' }, { status: 500 })
  }

  let extracted
  try {
    const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    extracted = JSON.parse(cleaned)
  } catch {
    return Response.json({ error: 'Could not parse CV data — ensure the PDF contains selectable text, not scanned images' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        skills: extracted.skills,
        experience_level: extracted.experience_level,
        target_roles: extracted.target_roles,
        cv_summary: extracted.cv_summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
