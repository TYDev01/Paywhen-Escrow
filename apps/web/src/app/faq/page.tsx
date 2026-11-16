import type { Metadata } from "next";
import { MarketingShell, PageHeader } from "@/components/marketing/shell";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <MarketingShell>
      <PageHeader title="Questions, answered" />
      <Faq />
    </MarketingShell>
  );
}
