"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { registerSchema, type RegisterFormData } from "../schemas"
import { authService } from "../api"

export const RegisterForm = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onChange",
  })

  const registerWithClear = (name: keyof RegisterFormData) => {
    const { onChange, ...rest } = register(name)
    return {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        if (error) setError(null)
        return onChange(e)
      },
      ...rest,
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    try {
      await authService.register({ email: data.email, password: data.password })
      setSuccess(true)
      setTimeout(() => router.push("/login"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 px-3 py-3 text-center text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
        Account created successfully. Redirecting to login...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          {...registerWithClear("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={!!errors.password}
          {...registerWithClear("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          id="confirmPassword"
          placeholder="Repeat your password"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={!!errors.confirmPassword}
          {...registerWithClear("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>
    </form>
  )
}
