import { cn } from "@/lib/utils"

type ZodIssueLike = {
  path?: (string | number)[]
  message?: string
}

export type ZodErrorDisplayProps = {
  error?: unknown
  className?: string
}

export function formatZodIssues(error: unknown): { path: string; message: string }[] {
  if (!error) return []
  if (typeof error === "string") return [{ path: "", message: error }]

  const candidate =
    (error as { issues?: unknown }).issues ??
    (error as { detail?: unknown }).detail ??
    (error as { message?: string }).message

  if (Array.isArray(candidate)) {
    return (candidate as ZodIssueLike[])
      .filter((issue) => typeof issue?.message === "string")
      .map((issue) => ({
        path: (issue.path ?? []).join("."),
        message: issue.message ?? "Invalid value",
      }))
  }

  if (typeof candidate === "string") return [{ path: "", message: candidate }]

  return []
}

export function ZodErrorDisplay({ error, className }: ZodErrorDisplayProps) {
  const issues = formatZodIssues(error)
  if (issues.length === 0) return null

  return (
    <div
      role="alert"
      className={cn(
        "space-y-1 rounded-none border border-destructive/30 bg-destructive/5 p-3 text-xs",
        className,
      )}
    >
      {issues.map((issue, index) => (
        <p key={`${issue.path}-${index}`} className="text-destructive">
          {issue.path ? <span className="font-medium">{issue.path}: </span> : null}
          {issue.message}
        </p>
      ))}
    </div>
  )
}
