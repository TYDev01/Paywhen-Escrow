"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { authedFetch } from "@/lib/auth-store";
import { stateLabel } from "@/components/dashboard/state-badge";
import { useWorkspaceAccountUpdate } from "@/components/dashboard/workspace-shell";
import { WorkspaceIcon } from "@/components/dashboard/workspace-icon";
import { Button } from "@/components/ui/button";

const documentTypes = {
  PASSPORT: "Passport",
  NATIONAL_ID: "National ID card",
  DRIVERS_LICENSE: "Driver’s licence",
} as const;

interface Verification {
  status: string;
  profileReady: boolean;
  uploadsAvailable: boolean;
  canUpload: boolean;
  document: { type: keyof typeof documentTypes; uploadedAt: string } | null;
  liveVerificationAvailable: boolean;
  reviewedAt: string | null;
  expiresAt: string | null;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

type Feedback = { error: boolean; message: string } | null;

// Validate an image choice in the browser before it is sent (the server
// re-checks). Only images are accepted — no PDFs.
function pickSide(selected: File | undefined, set: (file?: File) => void, setFeedback: (f: Feedback) => void) {
  if (!selected) return set(undefined);
  if (!selected.type.startsWith("image/")) {
    setFeedback({ error: true, message: "Choose an image file (JPG, PNG, or WebP)." });
    return set(undefined);
  }
  if (selected.size > MAX_DOCUMENT_BYTES) {
    setFeedback({ error: true, message: "Choose an image of 5 MB or less." });
    return set(undefined);
  }
  setFeedback(null);
  set(selected);
}

function DocumentSideField({
  id,
  label,
  file,
  disabled,
  onPick,
}: {
  id: string;
  label: string;
  file?: File;
  disabled?: boolean;
  onPick: (file?: File) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>();

  // Build a temporary object URL for the chosen image and revoke it when the
  // selection changes or the component unmounts, so nothing leaks.
  useEffect(() => {
    if (!file) return setPreviewUrl(undefined);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex flex-col gap-2">
      <span className="workspace-upload-label">{label}</span>
      <label
        htmlFor={id}
        className={`flex aspect-[1.58] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border bg-surface-muted text-center text-xs text-fg-muted transition-colors hover:border-primary ${
          previewUrl ? "border-solid border-border" : "border-dashed border-border"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={`Preview of the ${label.toLowerCase()} of your document`} className="h-full w-full object-cover" />
        ) : (
          <span className="px-3">Tap to choose the {label.toLowerCase()} image</span>
        )}
      </label>
      <input
        id={id}
        className="workspace-file-input"
        type="file"
        disabled={disabled}
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => onPick(event.target.files?.[0])}
      />
    </div>
  );
}

export default function IdentityVerificationPage() {
  const updateAccount = useWorkspaceAccountUpdate();
  const [verification, setVerification] = useState<Verification>();
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [front, setFront] = useState<File>();
  const [back, setBack] = useState<File>();
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);

  useEffect(() => {
    const request = new AbortController();
    authedFetch<Verification>("/me/verification", { signal: request.signal })
      .then((details) => {
        if (request.signal.aborted) return;
        setVerification(details);
        updateAccount?.({ verification: details.status });
      })
      .catch(() => { if (!request.signal.aborted) setLoadError(true); });
    return () => request.abort();
  }, [loadAttempt, updateAccount]);

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!front || !back || !documentType) return;
    const body = new FormData();
    body.append("documentType", documentType);
    body.append("front", front);
    body.append("back", back);
    setSubmitting(true);
    setFeedback(null);
    try {
      const details = await authedFetch<Verification>("/me/verification/document", { method: "POST", body });
      setVerification(details);
      updateAccount?.({ verification: details.status });
      setFront(undefined);
      setBack(undefined);
      setDocumentType("");
      setFeedback({ error: false, message: "Your document was submitted." });
    } catch (error) {
      setFeedback({
        error: true,
        message: error instanceof ApiError ? error.message : "Couldn’t upload your document. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const status = verification?.status;
  const documentComplete = Boolean(verification?.document) && !verification?.canUpload;
  const statusText = status === "PENDING" ? "Request received" : status ? stateLabel(status) : null;
  const identityStep = status === "VERIFIED" ? "Complete"
    : status === "IN_REVIEW" ? "In review"
    : status === "REJECTED" || status === "EXPIRED" ? stateLabel(status)
    : verification?.liveVerificationAvailable ? "Waiting" : "Unavailable";

  return (
    <div className="workspace-content workspace-kyc">
      <header className="workspace-hero workspace-kyc-hero">
        <div>
          <span className="workspace-kyc-emblem"><WorkspaceIcon className="size-7" name="verify" /></span>
          <h1>Identity verification</h1>
          <p>See what you need to do and track your verification progress.</p>
        </div>
        {statusText && <span className="workspace-kyc-status">{statusText}</span>}
      </header>

      <section className="workspace-panel workspace-kyc-panel" aria-labelledby="verification-steps-title">
        <div className="workspace-panel-heading"><h2 id="verification-steps-title">Verification steps</h2></div>
        {verification ? (
          <ol className="workspace-kyc-steps">
            <li>
              <span className="workspace-kyc-number" data-complete={verification.profileReady} aria-hidden="true">
                {verification.profileReady ? <WorkspaceIcon name="check" /> : "1"}
              </span>
              <div>
                <h3>Prepare your profile</h3>
                <p>{verification.profileReady ? "Your legal name and country of residence are on file." : "Add your legal name and country of residence."}</p>
                {!verification.profileReady && <Button asChild variant="outline"><Link href="/dashboard/profile">Complete profile</Link></Button>}
              </div>
              <span className="workspace-kyc-step-status">{verification.profileReady ? "Complete" : "Action needed"}</span>
            </li>
            <li>
              <span className="workspace-kyc-number" data-complete={documentComplete} aria-hidden="true">
                {documentComplete ? <WorkspaceIcon name="check" /> : "2"}
              </span>
              <div>
                <h3>Submit an identity document</h3>
                {verification.document && (
                  <p>
                    {documentTypes[verification.document.type]} submitted{" "}
                    <time dateTime={verification.document.uploadedAt}>{dateFormat.format(new Date(verification.document.uploadedAt))}</time>
                  </p>
                )}
                {verification.canUpload ? (
                  <form className="workspace-upload-form" onSubmit={submitDocument}>
                    <label className="workspace-upload-label" htmlFor="kyc-document-type">Document type</label>
                    <select id="kyc-document-type" className="workspace-upload-select" value={documentType} required disabled={submitting}
                      onChange={(event) => setDocumentType(event.target.value)}>
                      <option value="">Choose a document type</option>
                      {Object.entries(documentTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <p id="kyc-file-hint" className="workspace-upload-label">
                      Upload clear photos of both sides — JPG, PNG, or WebP, up to 5 MB each.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DocumentSideField
                        id="kyc-document-front" label="Front" file={front} disabled={submitting}
                        onPick={(selected) => pickSide(selected, setFront, setFeedback)} />
                      <DocumentSideField
                        id="kyc-document-back" label="Back" file={back} disabled={submitting}
                        onPick={(selected) => pickSide(selected, setBack, setFeedback)} />
                    </div>
                    <Button type="submit" disabled={!documentType || !front || !back || submitting}>
                      {submitting ? "Uploading…" : "Submit document"}
                    </Button>
                  </form>
                ) : !verification.document && (
                  <p>{!verification.uploadsAvailable
                    ? "Identity document uploads are currently unavailable."
                    : !verification.profileReady
                      ? "Complete your profile to upload your document."
                      : "Your current verification status doesn’t require an upload."}</p>
                )}
                {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
              </div>
              <span className="workspace-kyc-step-status">{documentComplete ? "Submitted" : verification.canUpload ? "Ready" : "Waiting"}</span>
            </li>
            <li>
              <span className="workspace-kyc-number" data-complete={status === "VERIFIED"} aria-hidden="true">
                {status === "VERIFIED" ? <WorkspaceIcon name="check" /> : "3"}
              </span>
              <div>
                <h3>Complete the identity check</h3>
                <p>{status === "VERIFIED"
                  ? "Your identity has been verified."
                  : verification.liveVerificationAvailable
                    ? "Identity checks are handled by the verification provider."
                    : "Live identity checks will become available when a verification provider is connected."}</p>
                {verification.reviewedAt && <p>Reviewed <time dateTime={verification.reviewedAt}>{dateFormat.format(new Date(verification.reviewedAt))}</time></p>}
                {verification.expiresAt && <p>Expires <time dateTime={verification.expiresAt}>{dateFormat.format(new Date(verification.expiresAt))}</time></p>}
              </div>
              <span className="workspace-kyc-step-status">{identityStep}</span>
            </li>
          </ol>
        ) : loadError ? (
          <div className="workspace-message" role="alert">
            <p>Couldn’t load your verification status.</p>
            <Button variant="outline" onClick={() => { setLoadError(false); setLoadAttempt((value) => value + 1); }}>Try again</Button>
          </div>
        ) : <p className="workspace-message" role="status">Loading verification status…</p>}
      </section>
    </div>
  );
}
