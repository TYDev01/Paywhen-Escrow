"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { register as registerUser } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

const schema = z
  .object({
    displayName: z.string().trim().min(2, "Enter your name").max(80, "Use 80 characters or fewer"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(10, "Use at least 10 characters").max(200, "Use 200 characters or fewer"),
    confirmPassword: z.string().min(1, "Re-enter your password"),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords don’t match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

const fields: {
  name: keyof FormValues;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  description?: string;
  placeholder?: string;
}[] = [
  {
    name: "displayName",
    label: "Full name",
    type: "text",
    autoComplete: "name",
    description: "This is the name shown on your Escrow account.",
    placeholder: "e.g. Amara Okafor",
  },
  {
    name: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
    description: "You’ll use this address to log in.",
    placeholder: "you@example.com",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    description: "Use at least 10 characters.",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = React.useState<Partial<Record<keyof FormValues, boolean>>>({});
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await registerUser(values.email, values.displayName, values.password);
      router.push("/dashboard");
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not reach the server. Try again.",
      );
    }
  };

  return (
    <AuthShell title="Create your account" description="Create escrow agreements and manage them in one place.">
      {serverError && (
        <div role="alert" className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {fields.map(({ name, label, type, autoComplete, description, placeholder }) => {
          const isPassword = type === "password";
          const isVisible = isPassword && visiblePasswords[name] === true;
          const error = errors[name]?.message;
          const describedBy = [
            description && `${name}-description`,
            error && `${name}-error`,
          ].filter(Boolean).join(" ");
          const input = (
            <Input
              id={name}
              type={isVisible ? "text" : type}
              autoComplete={autoComplete}
              autoCapitalize={isPassword ? "none" : undefined}
              spellCheck={isPassword ? false : undefined}
              placeholder={placeholder}
              aria-describedby={describedBy || undefined}
              aria-invalid={error ? true : undefined}
              className={isPassword ? "pe-20" : undefined}
              required
              {...register(name)}
            />
          );

          return (
            <Field key={name} label={label} htmlFor={name} description={description} error={error}>
              {isPassword ? (
                <div className="relative">
                  {input}
                  <button
                    type="button"
                    aria-controls={name}
                    aria-label={`${isVisible ? "Hide" : "Show"} ${name === "confirmPassword" ? "password confirmation" : "password"}`}
                    onClick={() => setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }))}
                    className="absolute inset-y-0 end-0 min-w-16 rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:-outline-offset-2"
                  >
                    {isVisible ? "Hide" : "Show"}
                  </button>
                </div>
              ) : input}
            </Field>
          );
        })}
        <Button type="submit" className="h-12 w-full rounded-md" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
