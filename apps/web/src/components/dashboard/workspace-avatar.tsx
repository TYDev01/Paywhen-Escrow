export function WorkspaceAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return (
    <span className="workspace-avatar" aria-hidden="true">
      {avatarUrl ? (
        // The authenticated API returns a resized WebP data URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" />
      ) : initials}
    </span>
  );
}
