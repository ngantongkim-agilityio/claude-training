export const formatDisplayDate = (value: string) => {
  if (!value) return ""
  const [year, month, day] = value.split("-")
  return `${month}/${day}/${year}`
}
