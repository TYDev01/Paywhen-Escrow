import Link from "next/link";

export function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s7-3.5 7-9V6l-7-3-7 3v7c0 5.5 7 9 7 9Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M16 4H7a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h9v-5H9V9h7V4Zm8 0h9a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3h-9v-5h7V9h-7V4Z" fill="currentColor" />
      <path d="m20 12 8 8-8 8-8-8 8-8Z" fill="currentColor" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link href="/" className="inline-flex w-fit items-center gap-2 font-display text-[1.7rem] font-bold leading-none tracking-[-0.07em]">
      <BrandMark className="size-8 text-primary" />
      Escrow
    </Link>
  );
}
