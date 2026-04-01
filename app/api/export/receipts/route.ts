import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { generateExcel, generateCSV, generatePDF } from "@/lib/export"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = request.nextUrl
  const format = searchParams.get("format") || "xlsx"
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  let query = supabase
    .from('Receipt')
    .select('*, Member(name, branch), Fund(name)')
    .order('date', { ascending: false })

  if (from) query = query.gte('date', new Date(from).toISOString())
  if (to) query = query.lte('date', new Date(to + "T23:59:59.999Z").toISOString())

  const { data: receipts, error } = await query
  if (error) throw error

  const data = receipts.map((r) => {
    const member = r.Member as { name: string; branch: string | null }
    const fund = r.Fund as { name: string }
    return {
      Date: new Date(r.date).toLocaleDateString("en-IN"),
      Member: member.name,
      Branch: member.branch || "",
      Fund: fund.name,
      "For Month": r.forMonth || "-",
      Amount: r.amount,
      Status: r.status,
      Narration: r.narration || "",
    }
  })

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
