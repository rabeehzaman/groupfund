import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" },
      { status: 400 }
    )
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum 5MB." },
      { status: 400 }
    )
  }

  const bucket = (formData.get("bucket") as string) || "proofs"
  const ext = file.name.split(".").pop() || "bin"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return NextResponse.json(
      { error: "Upload failed: " + error.message },
      { status: 500 }
    )
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
