import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getMemberWiseReport } from "@/lib/actions/reports"
import { generateExcel, generateCSV, generatePDF } from "@/lib/export"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = request.nextUrl
  const format = searchParams.get("format") || "xlsx"
  const from = searchParams.get("from") || undefined
  const to = searchParams.get("to") || undefined
  const fundId = searchParams.get("fundId") || undefined

  const report = await getMemberWiseReport(from, to, fundId)

  const data = report.map((m) => ({
    Member: m.name,
    Branch: m.branch || "",
    "Total Paid": m.totalPaid,
    "Expected Total": m.expectedTotal,
    "Pending Amount": Math.max(0, m.pendingAmount),
    "Months Paid": m.monthsPaid,
    "Pending Months": Math.max(0, m.pendingMonths),
  }))

  if (format === "csv") {
    const csv = generateCSV(data)
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=report.csv",
      },
    })
  }

  if (format === "pdf") {
    const headers = [
      "Member",
      "Branch",
      "Total Paid",
      "Expected",
      "Pending",
      "Months Paid",
    ]
    const rows = data.map((d) => [
      d.Member,
      d.Branch,
      String(d["Total Paid"]),
      String(d["Expected Total"]),
      String(d["Pending Amount"]),
      String(d["Months Paid"]),
    ])
    const pdf = generatePDF("Member-wise Report", headers, rows)
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=report.pdf",
      },
    })
  }

  const buffer = generateExcel(data, "Report")
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=report.xlsx",
    },
  })
}
