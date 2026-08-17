"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { toast } from "@/components/common/toast"
import { FormField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { ZodErrorDisplay } from "@/components/forms/zod-error-display"
import { Input } from "@/components/ui/input"
import { getAuthErrorMessage } from "@/lib/auth"
import { RegisterFormSchema, type RegisterFormValues } from "@/modules/auth/schema"
import { useAuthStore } from "@/modules/auth/store"

export function RegisterForm() {
  const router = useRouter()
  const register = useAuthStore((state) => state.register)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null)
    try {
      await register({
        email: values.email,
        password: values.password,
        full_name: values.fullName || null,
      })
      toast.success("Account created. Welcome to Eligo.")
      router.replace("/account")
      router.refresh()
    } catch (error) {
      setServerError(getAuthErrorMessage(error))
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField name="fullName" label="Full name (optional)">
          {(field) => (
            <Input
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              {...field}
            />
          )}
        </FormField>

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
                autoComplete="new-password"
                placeholder="At least 8 characters"
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

        <FormField name="confirmPassword" label="Confirm password">
          {(field) => (
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              {...field}
            />
          )}
        </FormField>

        {serverError ? <ZodErrorDisplay error={serverError} /> : null}

        <SubmitButton
          isPending={form.formState.isSubmitting}
          pendingText="Creating account…"
          className="w-full"
        >
          Create account
        </SubmitButton>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-brown hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </FormProvider>
  )
}
