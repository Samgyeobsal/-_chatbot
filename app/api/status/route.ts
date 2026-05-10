import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from("group_news")
    .select("title", { count: "exact", head: false })
    .limit(1)

  const ready = !error && data !== null && data.length > 0
  return NextResponse.json({ ready })
}
