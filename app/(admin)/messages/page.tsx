import Link from "next/link"
import Image from "next/image"
import { MessageSquare, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllMessages } from "@/lib/actions/messages"
import { formatDateTime } from "@/lib/format"

export default async function AdminMessagesPage() {
  const messages = await getAllMessages()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Member Messages
        </h1>
        <p className="text-muted-foreground mt-1">
          Notes and queries sent by members.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="size-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No messages from members yet.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((msg: any) => (
                <div key={msg.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="shrink-0">
                    {msg.member?.photoUrl ? (
                      <Image
                        src={msg.member.photoUrl}
                        alt={msg.member.name}
                        width={40}
                        height={40}
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <User className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      {msg.member ? (
                        <Link
                          href={`/members/${msg.member.id}`}
                          className="font-medium hover:underline"
                        >
                          {msg.member.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-muted-foreground">
                          Unknown member
                        </span>
                      )}
                      {msg.member?.branch && (
                        <span className="text-muted-foreground text-xs">
                          &middot; {msg.member.branch}
                        </span>
                      )}
                      <span className="text-muted-foreground ml-auto text-xs">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
