"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [passwordChanged, setPasswordChanged] = React.useState(false);
  React.useEffect(() => {
    setPasswordChanged(new URLSearchParams(window.location.search).get("passwordChanged") === "1");
  }, []);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not reach the server. Try again.",
      );
    }
  };

  return (
    <AuthShell title="Welcome back" description="Log in to manage your transactions.">
      {passwordChanged && (
        <p role="status" className="mt-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm">
          Password changed. Sign in with your new password.
        </p>
      )}
      {serverError && (
        <div role="alert" className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        <Button type="submit" className="h-12 w-full rounded-md" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-fg-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
