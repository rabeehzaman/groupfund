"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { CldUploadWidget } from "next-cloudinary"
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
import { updateMyProfile } from "@/lib/actions/portal"

type Member = {
  id: string
  name: string
  branch: string
  joinDate: Date
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

export function MemberProfileForm({ member }: { member: Member }) {
  const [state, formAction, isPending] = useActionState(updateMyProfile, null)
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl || "")
  const [memberOfJAA, setMemberOfJAA] = useState(member.memberOfJAA)
  const [memberOfAKBJAF, setMemberOfAKBJAF] = useState(member.memberOfAKBJAF)
  const [pmjjby, setPmjjby] = useState(member.pmjjby)
  const [pmsby, setPmsby] = useState(member.pmsby)
  const [bloodGroup, setBloodGroup] = useState(member.bloodGroup || "")

  useEffect(() => {
    if (state?.success) {
      toast.success("Profile updated successfully")
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={member.name}
                  width={120}
                  height={120}
                  className="size-28 rounded-full object-cover border-2 border-muted"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-full bg-muted border-2 border-muted-foreground/20">
                  <User className="size-12 text-muted-foreground" />
                </div>
              )}
              <CldUploadWidget
                signatureEndpoint="/api/cloudinary-sign"
                options={{
                  maxFiles: 1,
                  resourceType: "image",
                  folder: "bizarchcollective/profiles",
                  cropping: true,
                  croppingAspectRatio: 1,
                  croppingShowDimensions: true,
                }}
                onSuccess={(result) => {
                  if (typeof result.info === "object" && result.info?.secure_url) {
                    setPhotoUrl(result.info.secure_url)
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                  >
                    <Camera className="size-4" />
                  </button>
                )}
              </CldUploadWidget>
            </div>
            <input type="hidden" name="photoUrl" value={photoUrl} />
            <div className="text-center">
              <p className="font-semibold text-lg">{member.name}</p>
              <p className="text-muted-foreground text-sm">{member.branch || "No branch"}</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  defaultValue={member.mobileNumber || ""}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipNumber">Membership Number</Label>
                <Input
                  id="membershipNumber"
                  name="membershipNumber"
                  defaultValue={member.membershipNumber || ""}
                  placeholder="Enter membership number"
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
                  defaultValue={member.dateOfBirth ? new Date(member.dateOfBirth) : undefined}
                  placeholder="Select DOB"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Association</Label>
                <DatePicker
                  name="dateOfAssociation"
                  defaultValue={member.dateOfAssociation ? new Date(member.dateOfAssociation) : undefined}
                  placeholder="Select DOA"
                />
              </div>
            </div>
          </div>

          {/* Associations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Associations</h3>
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
            <div className="space-y-2">
              <Label htmlFor="presentDesignation">Present Designation</Label>
              <Input
                id="presentDesignation"
                name="presentDesignation"
                defaultValue={member.presentDesignation || ""}
                placeholder="Enter current designation"
              />
            </div>
          </div>

          {/* Insurance */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Insurance</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="hidden" name="pmjjby" value={String(pmjjby)} />
                <Checkbox
                  id="pmjjby"
                  checked={pmjjby}
                  onCheckedChange={(checked) => setPmjjby(!!checked)}
                />
                <Label htmlFor="pmjjby" className="cursor-pointer">PMJJBY (Life Cover)</Label>
              </div>
              {pmjjby && (
                <div className="space-y-2 pl-8">
                  <Label htmlFor="pmjjbyDetails">Policy Details</Label>
                  <Input
                    id="pmjjbyDetails"
                    name="pmjjbyDetails"
                    defaultValue={member.pmjjbyDetails || ""}
                    placeholder="Enter policy number or details"
                  />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="hidden" name="pmsby" value={String(pmsby)} />
                <Checkbox
                  id="pmsby"
                  checked={pmsby}
                  onCheckedChange={(checked) => setPmsby(!!checked)}
                />
                <Label htmlFor="pmsby" className="cursor-pointer">PMSBY (Accident Cover)</Label>
              </div>
              {pmsby && (
                <div className="space-y-2 pl-8">
                  <Label htmlFor="pmsbyDetails">Policy Details</Label>
                  <Input
                    id="pmsbyDetails"
                    name="pmsbyDetails"
                    defaultValue={member.pmsbyDetails || ""}
                    placeholder="Enter policy number or details"
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select blood group">
                    {bloodGroup || "Select blood group"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchAddress">Branch Address</Label>
              <Textarea
                id="branchAddress"
                name="branchAddress"
                defaultValue={member.branchAddress || ""}
                placeholder="Enter branch address"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homeAddress">Home Address</Label>
              <Textarea
                id="homeAddress"
                name="homeAddress"
                defaultValue={member.homeAddress || ""}
                placeholder="Enter home address"
                rows={2}
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
