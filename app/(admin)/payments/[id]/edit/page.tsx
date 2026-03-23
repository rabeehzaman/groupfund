import { notFound } from "next/navigation"
import { getPayment } from "@/lib/actions/payments"
import { PaymentForm } from "@/components/payment-form"

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payment = await getPayment(id)

  if (!payment) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Payment</h1>
      <PaymentForm payment={payment} />
    </div>
  )
}
