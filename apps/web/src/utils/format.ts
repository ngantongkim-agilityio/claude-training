export const formatDisplayDate = (value: string) => {
  if (!value) return ""
  const [year, month, day] = value.split("-")
  return `${month}/${day}/${year}`
}

// Same output as the detail page's amount rows; a missing value shows "—"
export const formatAmount = (value?: number | null) =>
  value == null
    ? "—"
    : `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
