import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export function generateExcel(
  data: Record<string, unknown>[],
  sheetName: string
): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer
  return buf
}

export function generateCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ""
  const headers = Object.keys(data[0])
  const escape = (v: unknown) => {
    const s = String(v ?? "")
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const rows = data.map((row) => headers.map((h) => escape(row[h])).join(","))
  return [headers.join(","), ...rows].join("\n")
}

export function generatePDF(
  title: string,
  headers: string[],
  rows: string[][]
): ArrayBuffer {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 22)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 30)

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 36,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 51, 51] },
  })

  return doc.output("arraybuffer")
}
