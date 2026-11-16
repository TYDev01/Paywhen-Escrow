import type { Metadata } from "next";
import { MarketingShell, PageHeader, Prose } from "@/components/marketing/shell";
import { EscrowSteps } from "@/components/marketing/escrow-steps";
import { Media } from "@/components/ui/media";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <PageHeader
        title="Escrow in five transparent steps"
        subtitle="From agreeing the terms to releasing the funds, every stage is tracked and server-verified."
      />
      <Container className="pt-12">
        {/* Reserved media slot — drop a real asset at /public/assets to replace. */}
        <Media alt="" ratio="21 / 9" rounded="xl" />
      </Container>
      <EscrowSteps />
      <Prose>
        <h2>Why a state machine matters</h2>
        <p>
          Each transaction moves through an explicit, server-validated lifecycle. A
          transaction can only reach a “funded” or “completed” state through verified
          backend events — never from a browser request alone. This is what makes the
          outcome trustworthy for both sides.
        </p>
        <h2>What happens if there’s a disagreement</h2>
        <p>
          Either party can open a dispute with evidence. Trained dispute agents review the
          case and apply the agreed resolution policy. Every decision is recorded with a
          full audit trail.
        </p>
      </Prose>
    </MarketingShell>
  );
}
