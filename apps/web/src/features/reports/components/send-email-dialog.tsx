"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SendEmailDialogProps {
  open: boolean
  onClose: () => void
  onSend: (recipientEmail?: string) => void
  isPending: boolean
}

export const SendEmailDialog = ({
  open,
  onClose,
  onSend,
  isPending,
}: SendEmailDialogProps) => {
  const [email, setEmail] = useState("")

  if (!open) return null

  const handleSend = () => {
    // Pass undefined when empty so the backend uses the authenticated user's email
    onSend(email.trim() || undefined)
    setEmail("")
  }

  const handleClose = () => {
    setEmail("")
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-email-title"
    >
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="send-email-title" className="text-lg font-semibold">
          Send Report via Email
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Leave blank to send to your own email address.
        </p>

        <div className="mt-4 space-y-2">
          <Label htmlFor="recipient-email">Recipient Email (optional)</Label>
          <Input
            id="recipient-email"
            type="email"
            placeholder="recipient@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending}>
            {isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  )
}
