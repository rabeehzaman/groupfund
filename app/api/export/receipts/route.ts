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

  const receipts = await db.receipt.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      member: { select: { name: true, branch: true } },
      fund: { select: { name: true } },
    },
  })

  const data = receipts.map((r) => ({
    Date: r.date.toLocaleDateString("en-IN"),
    Member: r.member.name,
    Branch: r.member.branch || "",
    Fund: r.fund.name,
    "For Month": r.forMonth,
    Amount: r.amount,
    Status: r.status,
    Narration: r.narration || "",
  }))

  if (format === "csv") {
    const csv = generateCSV(data)
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=receipts.csv",
      },
    })
  }

  if (format === "pdf") {
    const headers = ["Date", "Member", "Fund", "For Month", "Amount", "Status"]
    const rows = data.map((d) => [
      d.Date,
      d.Member,
      d.Fund,
      d["For Month"],
      String(d.Amount),
      d.Status,
    ])
    const pdf = generatePDF("Receipts Report", headers, rows)
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=receipts.pdf",
      },
    })
  }

  // Default: Excel
  const buffer = generateExcel(data, "Receipts")
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=receipts.xlsx",
    },
  })
}
