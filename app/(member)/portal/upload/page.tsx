import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyReceiptsForUpload } from "@/lib/actions/portal"
import { ProofUploadForm } from "@/components/proof-upload-form"

export default async function UploadProofPage() {
  const receipts = await getMyReceiptsForUpload()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Upload Payment Proof
        </h1>
        <p className="text-muted-foreground mt-1">
          Attach a screenshot or receipt for your payments.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Upload Proof</CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No receipts found. Your payments will appear here once recorded
              by an admin.
            </p>
          ) : (
            <ProofUploadForm
              receipts={receipts.map((r: any) => ({
                id: r.id,
                forMonth: r.forMonth,
                amount: r.amount,
                fundName: r.fund.name,
                proofUrl: r.proofUrl,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
