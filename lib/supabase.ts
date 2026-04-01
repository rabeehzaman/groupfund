import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export function generateId() {
  return crypto.randomUUID()
}

export function now() {
  return new Date().toISOString()
}
