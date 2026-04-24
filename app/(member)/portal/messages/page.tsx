import { MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyMessages } from "@/lib/actions/messages"
import { formatDateTime } from "@/lib/format"
import { MessageForm } from "@/components/message-form"

export default async function MyMessagesPage() {
  const messages = await getMyMessages()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Messages
        </h1>
        <p className="text-muted-foreground mt-1">
          Send a note, question, or payment doubt to the admin.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Message</CardTitle>
          </CardHeader>
          <CardContent>
            <MessageForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Your Messages ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="size-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  You haven&apos;t sent any messages yet.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {messages.map((msg: any) => (
                  <div key={msg.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="whitespace-pre-wrap text-sm">
                      {msg.content}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDateTime(msg.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
