"use client"

import { SpinnerIcon } from "@phosphor-icons/react"
import { useFormStatus } from "react-dom"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SubmitButtonProps = ButtonProps & {
  pendingText?: string
  hidePendingText?: boolean
  isPending?: boolean
}

export function SubmitButton({
  children,
  pendingText,
  hidePendingText = false,
  isPending,
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  const { pending: statusPending } = useFormStatus()
  const pending = isPending ?? statusPending

  return (
    <Button
      type="submit"
      variant="primary"
      disabled={disabled || pending}
      className={cn("gap-2", className)}
      {...props}
    >
      {pending ? (
        <SpinnerIcon className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {pending && !hidePendingText ? (pendingText ?? children) : children}
    </Button>
  )
}
