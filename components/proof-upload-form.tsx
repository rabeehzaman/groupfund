"use client"

import { useState } from "react"
import { Upload, FileImage, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { attachProofToReceipt } from "@/lib/actions/portal"
import { formatCurrency, formatMonthYear } from "@/lib/format"

type Receipt = {
  id: string
  forMonth: string | null
  amount: number
  fundName: string
  proofUrl: string | null
}

export function ProofUploadForm({ receipts }: { receipts: Receipt[] }) {
  const [selectedReceipt, setSelectedReceipt] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReceipt || !file) {
      toast.error("Please select a receipt and a file.")
      return
    }

    setUploading(true)
    try {
      // Upload file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", "proofs")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Upload failed")
        return
      }

      // Attach to receipt
      await attachProofToReceipt(selectedReceipt, data.url)
      toast.success("Proof uploaded successfully!")
      clearFile()
      setSelectedReceipt("")
    } catch {
      toast.error("Failed to upload proof.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Select Receipt</Label>
        <Select value={selectedReceipt} onValueChange={(v) => setSelectedReceipt(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a receipt to attach proof" />
          </SelectTrigger>
          <SelectContent>
            {receipts.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.forMonth ? formatMonthYear(r.forMonth) : "Payment"} - {r.fundName} -{" "}
                {formatCurrency(r.amount)}
                {r.proofUrl ? " (has proof)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Upload File</Label>
        {file ? (
          <div className="flex items-center gap-3 rounded-md border p-3">
            <FileImage className="size-8 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-muted-foreground text-xs">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={clearFile}>
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-6 transition-colors hover:bg-muted">
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              Click to upload (JPEG, PNG, PDF, max 5MB)
            </p>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {preview && (
        <div className="overflow-hidden rounded-md border">
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 w-full object-contain"
          />
        </div>
      )}

      <Button type="submit" disabled={!selectedReceipt || !file || uploading}>
        {uploading ? "Uploading..." : "Upload Proof"}
      </Button>
    </form>
  )
}
