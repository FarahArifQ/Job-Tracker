import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json([], { status: 401 })

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return Response.json([], { status: 500 })
  return Response.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id, status } = await req.json()
  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json({ success: true })
}
