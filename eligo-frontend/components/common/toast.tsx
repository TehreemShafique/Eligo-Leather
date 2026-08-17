"use client"

import { toast as sonnerToast, type ExternalToast } from "sonner"

export { Toaster } from "@/components/ui/sonner"
export type { ExternalToast, ToastT } from "sonner"

export const toast = {
  success: (message: string, data?: ExternalToast) => sonnerToast.success(message, data),
  error: (message: string, data?: ExternalToast) => sonnerToast.error(message, data),
  info: (message: string, data?: ExternalToast) => sonnerToast.info(message, data),
  warning: (message: string, data?: ExternalToast) => sonnerToast.warning(message, data),
  loading: (message: string, data?: ExternalToast) => sonnerToast.loading(message, data),
  message: (message: string, data?: ExternalToast) => sonnerToast(message, data),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  promise: <T,>(
    promise: Promise<T>,
    data: { loading: string; success: string | ((data: T) => string); error: string | ((error: unknown) => string) },
  ) => sonnerToast.promise(promise, data),
}
