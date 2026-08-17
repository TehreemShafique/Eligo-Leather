import { z } from "zod"

export const LoginFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const RegisterFormSchema = z
  .object({
    fullName: z.string().min(2, "Enter at least 2 characters").optional(),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  full_name: z.string().nullable().optional(),
})

export const UserOutSchema = z.object({
  id: z.number(),
  email: z.string(),
  full_name: z.string().nullable().optional(),
  is_admin: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type LoginFormValues = z.infer<typeof LoginFormSchema>
export type RegisterFormValues = z.infer<typeof RegisterFormSchema>
