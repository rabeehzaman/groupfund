"use client"

import { useRef, useState } from "react"
import { useActionState } from "react"
import Image from "next/image"
import { Camera, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { createMember, updateMember } from "@/lib/actions/members"

type Member = {
  id: string
  name: string
  branch: string
  monthlyAmount: number
  isActive: boolean
  photoUrl: string | null
  mobileNumber: string | null
  membershipNumber: string | null
  dateOfBirth: Date | null
  dateOfAssociation: Date | null
  memberOfJAA: boolean
  memberOfAKBJAF: boolean
  presentDesignation: string | null
  pmjjby: boolean
  pmjjbyDetails: string | null
  pmsby: boolean
  pmsbyDetails: string | null
  bloodGroup: string | null
  branchAddress: string
  homeAddress: string
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function MemberForm({ member }: { member?: Member }) {
  const action = member
    ? updateMember.bind(null, member.id)
    : createMember

  const [state, formAction, isPending] = useActionState(action, null)
  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl || "")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [memberOfJAA, setMemberOfJAA] = useState(member?.memberOfJAA ?? false)
  const [memberOfAKBJAF, setMemberOfAKBJAF] = useState(member?.memberOfAKBJAF ?? false)
  const [pmjjby, setPmjjby] = useState(member?.pmjjby ?? false)
  const [pmsby, setPmsby] = useState(member?.pmsby ?? false)
  const [bloodGroup, setBloodGroup] = useState(member?.bloodGroup || "")

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{member ? "Edit Member" : "Add Member"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="size-20 rounded-full object-cover border-2 border-muted"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                  <User className="size-8 text-muted-foreground" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setUploading(true)
                  const fd = new FormData()
                  fd.append("file", f)
                  fd.append("bucket", "profiles")
                  try {
                    const res = await fetch("/api/upload", { method: "POST", body: fd })
                    const data = await res.json()
                    if (res.ok) setPhotoUrl(data.url)
                  } finally {
                    setUploading(false)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <Camera className="size-3" />
              </button>
            </div>
            <input type="hidden" name="photoUrl" value={photoUrl} />
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={member?.name}
                  placeholder="Enter member name"
                  required
                />
                {state?.error?.name && (
                  <p className="text-destructive text-sm">{state.error.name[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch / Area</Label>
                <Input
                  id="branch"
                  name="branch"
                  defaultValue={member?.branch}
                  placeholder="Enter branch or area"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyAmount">Monthly Amount</Label>
                <Input
                  id="monthlyAmount"
                  name="monthlyAmount"
                  type="number"
                  min="0"
                  defaultValue={member?.monthlyAmount ?? 1000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  defaultValue={member?.mobileNumber || ""}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipNumber">Membership Number</Label>
                <Input
                  id="membershipNumber"
                  name="membershipNumber"
                  defaultValue={member?.membershipNumber || ""}
                  placeholder="Enter membership number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="presentDesignation">Present Designation</Label>
                <Input
                  id="presentDesignation"
                  name="presentDesignation"
                  defaultValue={member?.presentDesignation || ""}
                  placeholder="Enter designation"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dates</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <DatePicker
                  name="dateOfBirth"
                  defaultValue={member?.dateOfBirth ? new Date(member.dateOfBirth) : undefined}
                  placeholder="Select DOB"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Association</Label>
                <DatePicker
                  name="dateOfAssociation"
                  defaultValue={member?.dateOfAssociation ? new Date(member.dateOfAssociation) : undefined}
                  placeholder="Select DOA"
                />
              </div>
            </div>
          </div>

          {/* Associations & Insurance */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Associations & Insurance</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <input type="hidden" name="memberOfJAA" value={String(memberOfJAA)} />
                <Checkbox
                  id="memberOfJAA"
                  checked={memberOfJAA}
                  onCheckedChange={(checked) => setMemberOfJAA(!!checked)}
                />
                <Label htmlFor="memberOfJAA" className="cursor-pointer">Member of JAA</Label>
              </div>
              <div className="flex items-center gap-3">
                <input type="hidden" name="memberOfAKBJAF" value={String(memberOfAKBJAF)} />
                <Checkbox
                  id="memberOfAKBJAF"
                  checked={memberOfAKBJAF}
                  onCheckedChange={(checked) => setMemberOfAKBJAF(!!checked)}
                />
                <Label htmlFor="memberOfAKBJAF" className="cursor-pointer">Member of AKBJAF</Label>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="hidden" name="pmjjby" value={String(pmjjby)} />
                <Checkbox id="pmjjby" checked={pmjjby} onCheckedChange={(checked) => setPmjjby(!!checked)} />
                <Label htmlFor="pmjjby" className="cursor-pointer">PMJJBY (Life Cover)</Label>
              </div>
              {pmjjby && (
                <div className="pl-8">
                  <Input
                    name="pmjjbyDetails"
                    defaultValue={member?.pmjjbyDetails || ""}
                    placeholder="Policy number or details"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input type="hidden" name="pmsby" value={String(pmsby)} />
                <Checkbox id="pmsby" checked={pmsby} onCheckedChange={(checked) => setPmsby(!!checked)} />
                <Label htmlFor="pmsby" className="cursor-pointer">PMSBY (Accident Cover)</Label>
              </div>
              {pmsby && (
                <div className="pl-8">
                  <Input
                    name="pmsbyDetails"
                    defaultValue={member?.pmsbyDetails || ""}
                    placeholder="Policy number or details"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Personal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal</h3>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <input type="hidden" name="bloodGroup" value={bloodGroup} />
              <Select value={bloodGroup} onValueChange={(v) => setBloodGroup(v ?? "")}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select blood group">
                    {bloodGroup || "Select blood group"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchAddress">Branch Address</Label>
              <Textarea
                id="branchAddress"
                name="branchAddress"
                defaultValue={member?.branchAddress || ""}
                placeholder="Enter branch address"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homeAddress">Home Address</Label>
              <Textarea
                id="homeAddress"
                name="homeAddress"
                defaultValue={member?.homeAddress || ""}
                placeholder="Enter home address"
                rows={2}
              />
            </div>
          </div>

          {member && (
            <input
              type="hidden"
              name="isActive"
              value={String(member.isActive)}
            />
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : member ? "Update" : "Add Member"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
