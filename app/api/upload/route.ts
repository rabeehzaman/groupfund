import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { auth } from "@/lib/auth"

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

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split(".").pop() || "bin"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const uploadDir = join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
