"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { toast } from "@/components/common/toast"
import { FormField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { ZodErrorDisplay } from "@/components/forms/zod-error-display"
import { Input } from "@/components/ui/input"
import { getAuthErrorMessage } from "@/lib/auth"
import { LoginFormSchema, type LoginFormValues } from "@/modules/auth/schema"
import { useAuthStore } from "@/modules/auth/store"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/account"
  const login = useAuthStore((state) => state.login)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)
    try {
      await login(values)
      const discount = useAuthStore.getState().welcomeDiscountPercentage
      if (discount !== null) {
        toast.success(`Welcome! Enjoy ${discount}% off your first order.`)
      } else {
        toast.success("Welcome back.")
      }
      router.replace(next)
      router.refresh()
    } catch (error) {
      setServerError(getAuthErrorMessage(error))
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField name="email" label="Email">
          {(field) => (
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...field}
            />
          )}
        </FormField>

        <FormField name="password" label="Password">
          {(field) => (
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
                {...field}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-0 right-0 flex h-9 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-brand-brown"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          )}
        </FormField>

        {serverError ? <ZodErrorDisplay error={serverError} /> : null}

        <SubmitButton
          isPending={form.formState.isSubmitting}
          pendingText="Signing in…"
          className="w-full"
        >
          Sign in
        </SubmitButton>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-brand-brown hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </FormProvider>
  )
}
