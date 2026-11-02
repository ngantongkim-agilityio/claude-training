import type { UseFormRegisterReturn } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { REVIEW_NOTE_MAX } from "@/features/invoices/schemas"

interface ReviewNoteFieldProps {
  id: string
  label: string
  placeholder?: string
  hint?: string
  length: number
  registration: UseFormRegisterReturn
}

export const ReviewNoteField = ({
  id,
  label,
  placeholder,
  hint,
  length,
  registration,
}: ReviewNoteFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <textarea
      id={id}
      rows={3}
      maxLength={REVIEW_NOTE_MAX}
      placeholder={placeholder}
      aria-describedby={`${id}-hint ${id}-count`}
      className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground/70 placeholder:text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
      {...registration}
    />
    <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
      <span id={`${id}-hint`}>{hint}</span>
      <span id={`${id}-count`}>
        {length}/{REVIEW_NOTE_MAX}
      </span>
    </div>
  </div>
)
