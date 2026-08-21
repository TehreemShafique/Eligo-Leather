"use client"

import type { ReactNode } from "react"
import { useFormContext, type FieldValues, type Path, type UseFormRegisterReturn } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type FormFieldProps<T extends FieldValues = FieldValues> = {
  name: Path<T>
  label?: string
  hint?: string
  className?: string
  children: (field: UseFormRegisterReturn & { id: string; invalid: boolean; "aria-invalid"?: "true" }) => ReactNode
}

function getPathValue(error: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (acc, key) =>
      acc && typeof acc === "object"
        ? (acc as Record<string, unknown>)[key]
        : undefined,
    error,
  )
}

export function FormField<T extends FieldValues = FieldValues>({
  name,
  label,
  hint,
  className,
  children,
}: FormFieldProps<T>) {
  const { register, formState } = useFormContext<T>()
  const error = getPathValue(formState.errors, name) as { message?: string } | undefined
  const invalid = Boolean(error)
  const id = name.replace(/\./g, "-")

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
      ) : null}

      {children({ id, invalid, "aria-invalid": invalid ? "true" : undefined, ...register(name) })}

      {invalid ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error?.message ?? "Invalid value"}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
