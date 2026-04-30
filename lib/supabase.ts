import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type JobApplication = {
  id: string
  created_at: string
  job_text: string
  role: string
  company: string
  match_score: number
  match_reason: string
  required_skills: string[]
  red_flags: string[]
  apply_recommendation: 'yes' | 'maybe' | 'no'
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected'
}
