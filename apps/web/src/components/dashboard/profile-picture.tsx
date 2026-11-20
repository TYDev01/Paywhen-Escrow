"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { useWorkspaceAccount, useWorkspaceAccountUpdate } from "./workspace-shell";
import { WorkspaceAvatar } from "./workspace-avatar";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfilePicture() {
  const account = useWorkspaceAccount();
  const updateAccount = useWorkspaceAccountUpdate();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string }>();

  // Live preview for the chosen file; the object URL is revoked on change/unmount.
  useEffect(() => {
    if (!file) return setPreviewUrl(undefined);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(selected: File | undefined) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setFeedback({ error: true, message: "Choose an image file (JPG, PNG, or WebP)." });
      return;
    }
    if (selected.size > MAX_AVATAR_BYTES) {
      setFeedback({ error: true, message: "Choose a picture of 2 MB or less." });
      return;
    }
    setFeedback(undefined);
    setFile(selected);
  }

  function reset() {
    setFile(undefined);
    if (input.current) input.current.value = "";
  }

  async function save() {
    if (!file) return;
    setUploading(true);
    setFeedback(undefined);
    const body = new FormData();
    body.append("file", file);
    try {
      const { avatarUrl } = await authedFetch<{ avatarUrl: string }>("/me/avatar", { method: "PUT", body });
      updateAccount?.({ avatarUrl });
      reset();
      setFeedback({ error: false, message: "Profile picture saved." });
    } catch (error) {
      setFeedback({ error: true, message: error instanceof ApiError ? error.message : "Couldn’t upload your picture. Try again." });
    } finally {
      setUploading(false);
    }
  }

  const shownUrl = previewUrl ?? account?.avatarUrl;

  return (
    <section className="workspace-panel workspace-status-panel" aria-labelledby="profile-picture-title">
      <h2 id="profile-picture-title">Profile picture</h2>

      <div className="profile-picture-edit">
        <button
          type="button"
          className="profile-picture-dropzone"
          disabled={uploading}
          onClick={() => input.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            choose(event.dataTransfer.files?.[0]);
          }}
          aria-label={shownUrl ? "Change profile picture" : "Add a profile picture"}
        >
          <WorkspaceAvatar name={account?.displayName ?? ""} avatarUrl={shownUrl} />
          <span className="profile-picture-camera" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
        </button>

        <div className="profile-picture-meta">
          <p>{file ? file.name : shownUrl ? "Looking good." : "No picture yet."}</p>
          <p className="profile-picture-hint">
            Click the photo or drag an image here. JPG, PNG, or WebP, up to 2&nbsp;MB.
          </p>
        </div>
      </div>

      <input
        ref={input}
        id="profile-picture-file"
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading}
        onChange={(event) => choose(event.target.files?.[0])}
      />

      <div className="profile-picture-actions">
        {file ? (
          <>
            <Button type="button" size="sm" onClick={save} disabled={uploading}>
              {uploading ? "Saving…" : "Save photo"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={uploading}>
              Cancel
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
            {account?.avatarUrl ? "Change photo" : "Upload photo"}
          </Button>
        )}
      </div>

      {feedback && (
        <p className="profile-picture-feedback" role={feedback.error ? "alert" : "status"} data-error={feedback.error}>
          {feedback.message}
        </p>
      )}
    </section>
  );
}
