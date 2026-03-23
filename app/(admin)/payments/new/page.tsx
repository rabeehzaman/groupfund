import { PaymentForm } from "@/components/payment-form"

export default function NewPaymentPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Add Payment</h1>
      <PaymentForm />
    </div>
  )
}
