import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateExcel, generateCSV, generatePDF } from "@/lib/export"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = request.nextUrl
  const format = searchParams.get("format") || "xlsx"
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const where: { date?: { gte?: Date; lte?: Date } } = {}
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to + "T23:59:59.999Z")
  }

  const payments = await db.payment.findMany({
    where,
    orderBy: { date: "desc" },
  })

  const data = payments.map((p) => ({
    Date: p.date.toLocaleDateString("en-IN"),
    Purpose: p.purpose,
    "Paid To": p.paidTo,
    Amount: p.amount,
    Narration: p.narration || "",
  }))

  if (format === "csv") {
    const csv = generateCSV(data)
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=payments.csv",
      },
    })
  }

  if (format === "pdf") {
    const headers = ["Date", "Purpose", "Paid To", "Amount", "Narration"]
    const rows = data.map((d) => [
      d.Date,
      d.Purpose,
      d["Paid To"],
      String(d.Amount),
      d.Narration,
    ])
    const pdf = generatePDF("Payments Report", headers, rows)
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=payments.pdf",
      },
    })
  }

  const buffer = generateExcel(data, "Payments")
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=payments.xlsx",
    },
  })
}
