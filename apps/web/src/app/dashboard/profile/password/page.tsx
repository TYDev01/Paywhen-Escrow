"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { authedFetch, clearTokens } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(200),
  newPassword: z.string().min(10, "Use at least 10 characters.").max(200, "Use 200 characters or fewer."),
  confirmPassword: z.string().min(1, "Confirm your new password."),
}).superRefine((values, ctx) => {
  if (values.newPassword === values.currentPassword) {
    ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Choose a different password." });
  }
  if (values.newPassword !== values.confirmPassword) {
    ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords don’t match." });
  }
});
type PasswordValues = z.infer<typeof schema>;

const fields = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password", hint: undefined },
  { name: "newPassword", label: "New password", autoComplete: "new-password", hint: "Use at least 10 characters." },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password", hint: undefined },
] as const;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>();
  const [changed, setChanged] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordValues>({
    resolver: zodResolver(schema),
  });

  async function change({ currentPassword, newPassword }: PasswordValues) {
    setFeedback(undefined);
    try {
      await authedFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      clearTokens();
      reset();
      setChanged(true);
      router.replace("/login?passwordChanged=1");
    } catch (error) {
      setFeedback(
        error instanceof ApiError
          ? error.status === 429 ? "Too many attempts. Wait a minute and try again." : error.message
          : "Couldn’t change your password. Try again.",
      );
    }
  }

  return (
    <div className="workspace-content workspace-settings">
      <Link href="/dashboard/profile" className="workspace-text-link">Back to profile</Link>
      <header className="workspace-page-heading">
        <div>
          <h1>Change password</h1>
          <p>You’ll sign in again with your new password. Other sessions will end too.</p>
        </div>
      </header>
      <section className="workspace-panel max-w-xl" aria-labelledby="password-form-title">
        <div className="workspace-panel-heading"><h2 id="password-form-title">Password details</h2></div>
        <form noValidate onSubmit={handleSubmit(change)} className="workspace-settings-form">
          {fields.map(({ name, label, autoComplete, hint }) => {
            const error = errors[name]?.message;
            const description = [hint && `${name}-description`, error && `${name}-error`].filter(Boolean).join(" ");
            return (
              <Field key={name} label={label} htmlFor={name} description={hint} error={error}>
                <Input id={name} type="password" autoComplete={autoComplete} required
                  aria-invalid={Boolean(error)} aria-describedby={description || undefined} {...register(name)} />
              </Field>
            );
          })}
          <div className="workspace-settings-actions">
            <Button type="submit" disabled={isSubmitting || changed}>
              {isSubmitting ? "Changing…" : changed ? "Password changed" : "Change password"}
            </Button>
            {feedback && <p role="alert">{feedback}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}
