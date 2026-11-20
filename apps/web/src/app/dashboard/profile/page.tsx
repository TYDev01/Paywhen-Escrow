"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import {
  useWorkspaceAccount,
  useWorkspaceAccountUpdate,
  type AccountProfile,
} from "@/components/dashboard/workspace-shell";
import { ProfilePicture } from "@/components/dashboard/profile-picture";
import { WorkspaceIcon } from "@/components/dashboard/workspace-icon";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const schema = z.object({
  displayName: z.string().trim().min(2, "Enter a display name.").max(80, "Use 80 characters or fewer."),
  legalName: z.string().trim().max(120, "Use 120 characters or fewer."),
  phone: z.string().trim().max(40, "Use 40 characters or fewer."),
  country: z.string().trim().toUpperCase().regex(/^(?:[A-Z]{2})?$/, "Use a two-letter country code, such as NG."),
});
type ProfileValues = z.infer<typeof schema>;

const fields: {
  name: keyof ProfileValues;
  label: string;
  description?: string;
  autoComplete?: string;
  type?: "text" | "tel";
}[] = [
  { name: "displayName", label: "Display name", autoComplete: "nickname" },
  { name: "legalName", label: "Legal name", autoComplete: "name", description: "Enter your name as it appears on your identification." },
  { name: "phone", label: "Phone number", autoComplete: "tel", type: "tel" },
  { name: "country", label: "Country code", autoComplete: "country", description: "Use the two-letter code for your country of residence, such as NG." },
];

function profileValues(displayName: string, profile: AccountProfile | null): ProfileValues {
  return {
    displayName,
    legalName: profile?.legalName ?? "",
    phone: profile?.phone ?? "",
    country: profile?.country ?? "",
  };
}

export default function ProfilePage() {
  const account = useWorkspaceAccount();
  const updateAccount = useWorkspaceAccountUpdate();
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: profileValues(account?.displayName ?? "", account?.profile ?? null),
  });

  async function save(values: ProfileValues) {
    setFeedback(null);
    try {
      const profile = await authedFetch<AccountProfile>("/me", {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      updateAccount?.({ displayName: values.displayName, profile });
      reset(profileValues(values.displayName, profile));
      setFeedback({ error: false, message: "Profile saved." });
    } catch (error) {
      setFeedback({
        error: true,
        message: error instanceof ApiError && error.status === 401
          ? "Your session expired. Sign in again to update your profile."
          : "Couldn’t save your profile. Try again.",
      });
    }
  }

  return (
    <div className="workspace-content workspace-settings">
      <header className="workspace-page-heading">
        <div><h1>Profile</h1><p>Manage the personal details on your Escrow account.</p></div>
      </header>
      <div className="workspace-settings-grid">
        <section className="workspace-panel" aria-labelledby="personal-details-title">
          <div className="workspace-panel-heading"><h2 id="personal-details-title">Personal details</h2></div>
          <form onSubmit={handleSubmit(save)} noValidate className="workspace-settings-form">
            {fields.map(({ name, label, description, autoComplete, type = "text" }) => {
              const error = errors[name]?.message;
              const describedBy = [description && `${name}-description`, error && `${name}-error`].filter(Boolean).join(" ");
              return (
                <Field key={name} label={label} htmlFor={name} description={description} error={error}>
                  <Input id={name} type={type} autoComplete={autoComplete} required={name === "displayName"}
                    aria-invalid={Boolean(error)} aria-describedby={describedBy || undefined} {...register(name)} />
                </Field>
              );
            })}
            <div className="workspace-settings-actions">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save changes"}</Button>
              {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
            </div>
          </form>
        </section>
        <div className="grid gap-4">
          <ProfilePicture />
          <section className="workspace-panel workspace-status-panel" aria-labelledby="signin-details-title">
            <span className="workspace-tile-icon"><WorkspaceIcon name="account" /></span>
            <h2 id="signin-details-title">Sign-in email</h2>
            <p className="break-all">{account?.email}</p>
            <p>{account?.emailVerified ? "Verified" : "Unverified"}</p>
            <Link href="/dashboard/profile/password" className="workspace-text-link">Change password</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
