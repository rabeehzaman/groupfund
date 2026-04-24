import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <Image
          src="/logo.png"
          alt="Canara Bank Jewel Appraisers Association Malappuram"
          width={80}
          height={80}
          priority
          className="mx-auto mb-2 size-20 rounded-full object-cover"
        />
        <CardTitle className="text-xl">CBJAA Malappuram</CardTitle>
        <CardDescription>Sign in to manage the association fund.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
