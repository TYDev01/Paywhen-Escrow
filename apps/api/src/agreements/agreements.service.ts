import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import {
  moneyFromDecimalString,
  computeFees,
  serializeMoney,
  type CurrencyCode,
  type FeePayer,
} from "@escrow/core";
import { PrismaService } from "../prisma/prisma.service";
import { generateReference } from "../common/reference";
import type { CreateAgreementDto } from "./dto";
import type { AuthUser } from "../common/decorators/current-user.decorator";

// Platform fee schedule. In production this is config/policy-driven.
const PLATFORM_FEE_BPS = 100; // 1%
const PLATFORM_FEE_FIXED_MINOR = 0n;

@Injectable()
export class AgreementsService {
  constructor(private readonly prisma: PrismaService) {}

  private hashTerms(terms: unknown): string {
    return createHash("sha256").update(JSON.stringify(terms)).digest("hex");
  }

  async create(dto: CreateAgreementDto, actor: AuthUser) {
    const amount = moneyFromDecimalString(dto.amount, dto.currency as CurrencyCode);
    if (amount.amount <= 0n) {
      throw new BadRequestException("Amount must be positive");
    }

    // Two modes. Legacy: a counterparty email is supplied, binding both parties
    // up front. Open escrow: no email — the creator must be the seller, and a
    // buyer attaches later by paying the reference.
    const open = !dto.counterpartyEmail;
    let buyerId: string | null;
    let sellerId: string;

    if (open) {
      if (dto.creatorRole !== "SELLER") {
        throw new BadRequestException("Open escrows must be created by the seller. Add the buyer's email to create as the buyer.");
      }
      buyerId = null;
      sellerId = actor.id;
    } else {
      const counterparty = await this.prisma.user.findUnique({ where: { email: dto.counterpartyEmail } });
      if (!counterparty) throw new NotFoundException("Counterparty account not found");
      if (counterparty.id === actor.id) throw new BadRequestException("Buyer and seller must be different accounts");
      buyerId = dto.creatorRole === "BUYER" ? actor.id : counterparty.id;
      sellerId = dto.creatorRole === "SELLER" ? actor.id : counterparty.id;
    }

    const payoutType = dto.payoutType ?? "SINGLE";
    const milestones = this.resolveMilestones(payoutType, dto, amount.amount);

    const fees = computeFees(amount, {
      percentageBps: PLATFORM_FEE_BPS,
      fixedMinorUnits: PLATFORM_FEE_FIXED_MINOR,
      payer: dto.feePayer as FeePayer,
    });

    const terms = {
      title: dto.title,
      description: dto.description ?? "",
      category: dto.category,
      amount: serializeMoney(amount),
      feePayer: dto.feePayer,
      fee: serializeMoney(fees.platformFee),
      buyerTotal: serializeMoney(fees.buyerTotal),
      sellerPayout: serializeMoney(fees.sellerPayout),
      payoutType,
      milestones: milestones.map((m) => ({ title: m.title, amount: m.amountMinor.toString() })),
      inspectionPeriodHours: dto.inspectionPeriodHours,
      releaseConditions: dto.releaseConditions ?? null,
      refundConditions: dto.refundConditions ?? null,
      deliveryDeadline: dto.deliveryDeadline ?? null,
    };

    return this.prisma.$transaction(async (db) => {
      const agreement = await db.escrowAgreement.create({
        data: {
          reference: generateReference("ESC"),
          title: dto.title,
          description: dto.description ?? "",
          category: dto.category,
          buyerId,
          sellerId,
          amountMinor: amount.amount,
          currency: amount.currency,
          feePayer: dto.feePayer,
          feePercentBps: PLATFORM_FEE_BPS,
          feeFixedMinor: PLATFORM_FEE_FIXED_MINOR,
          payoutType,
          createdById: actor.id,
          milestones: milestones.length
            ? { create: milestones.map((m, i) => ({ order: i, title: m.title, amountMinor: m.amountMinor })) }
            : undefined,
          images: dto.images?.length
            ? { create: dto.images.map((img) => ({
                fileName: img.fileName,
                contentType: img.contentType,
                sizeBytes: img.sizeBytes,
                uploadedById: actor.id,
              })) }
            : undefined,
        },
      });

      const version = await db.agreementVersion.create({
        data: {
          agreementId: agreement.id,
          versionNumber: 1,
          termsJson: terms,
          termsHash: this.hashTerms(terms),
          deliveryDeadline: dto.deliveryDeadline ? new Date(dto.deliveryDeadline) : null,
          inspectionPeriodH: dto.inspectionPeriodHours,
          releaseConditions: dto.releaseConditions,
          refundConditions: dto.refundConditions,
        },
      });

      await db.escrowAgreement.update({
        where: { id: agreement.id },
        data: { currentVersionId: version.id },
      });

      // The creator implicitly accepts the terms they authored.
      await db.agreementAcceptance.create({
        data: { versionId: version.id, userId: actor.id, role: dto.creatorRole },
      });

      // Open escrows wait in DRAFT for a buyer; bound escrows go straight to
      // counterparty acceptance.
      const toState = open ? "DRAFT" : "PENDING_COUNTERPARTY_ACCEPTANCE";
      const transaction = await db.transaction.create({
        data: {
          reference: generateReference("TX"),
          agreementId: agreement.id,
          state: toState,
          stateHistory: open
            ? undefined
            : {
                create: {
                  fromState: "DRAFT",
                  toState: "PENDING_COUNTERPARTY_ACCEPTANCE",
                  actorId: actor.id,
                  reason: "Agreement created and sent for acceptance",
                },
              },
        },
      });

      return { agreement, version, transaction, fees: terms };
    });
  }

  /** Validate milestone inputs and return normalized rows (minor units). */
  private resolveMilestones(payoutType: string, dto: CreateAgreementDto, totalMinor: bigint) {
    if (payoutType !== "MILESTONES") return [] as { title: string; amountMinor: bigint }[];
    const inputs = dto.milestones ?? [];
    if (inputs.length < 1) throw new BadRequestException("Add at least one milestone");
    const rows = inputs.map((m) => {
      const money = moneyFromDecimalString(m.amount, dto.currency as CurrencyCode);
      if (money.amount <= 0n) throw new BadRequestException("Each milestone amount must be positive");
      return { title: m.title, amountMinor: money.amount };
    });
    const sum = rows.reduce((acc, r) => acc + r.amountMinor, 0n);
    if (sum !== totalMinor) {
      throw new BadRequestException("Milestone amounts must add up to the total amount");
    }
    return rows;
  }

  /** A buyer attaches to an open escrow by its transaction reference ("payment ID"). */
  async claim(reference: string, actor: AuthUser) {
    const tx = await this.prisma.transaction.findUnique({
      where: { reference: reference.trim() },
      include: { agreement: { include: { currentVersion: true } } },
    });
    if (!tx || !tx.agreement.currentVersion) {
      throw new NotFoundException("No escrow found for that payment ID");
    }
    const agreement = tx.agreement;
    if (agreement.sellerId === actor.id) {
      throw new BadRequestException("You can’t buy your own escrow");
    }
    if (agreement.buyerId && agreement.buyerId !== actor.id) {
      throw new ConflictException("This escrow already has a buyer");
    }

    const versionId = tx.agreement.currentVersion.id;

    await this.prisma.$transaction(async (db) => {
      if (!agreement.buyerId) {
        await db.escrowAgreement.update({ where: { id: agreement.id }, data: { buyerId: actor.id } });
      }
      await db.agreementAcceptance.upsert({
        where: { versionId_userId: { versionId, userId: actor.id } },
        update: {},
        create: { versionId, userId: actor.id, role: "BUYER" },
      });
      // DRAFT -> PENDING_COUNTERPARTY_ACCEPTANCE -> AWAITING_PAYMENT (both now agree).
      if (tx.state === "DRAFT") {
        await db.transaction.update({
          where: { id: tx.id },
          data: {
            state: "AWAITING_PAYMENT",
            version: { increment: 1 },
            stateHistory: {
              create: [
                { fromState: "DRAFT", toState: "PENDING_COUNTERPARTY_ACCEPTANCE", actorId: actor.id, reason: "Buyer attached to open escrow" },
                { fromState: "PENDING_COUNTERPARTY_ACCEPTANCE", toState: "AWAITING_PAYMENT", actorId: actor.id, reason: "Both parties accepted the agreed terms" },
              ],
            },
          },
        });
      }
      await db.auditLog.create({
        data: { actorId: actor.id, entityType: "EscrowAgreement", entityId: agreement.id, action: "escrow.claimed" },
      });
    });

    return { transactionId: tx.id, reference: tx.reference };
  }

  /** Record the counterparty's acceptance; advance to AWAITING_PAYMENT when both agree. */
  async accept(agreementId: string, actor: AuthUser) {
    const agreement = await this.prisma.escrowAgreement.findUnique({
      where: { id: agreementId },
      include: { currentVersion: true, transaction: true },
    });
    if (!agreement || !agreement.currentVersion) {
      throw new NotFoundException("Agreement not found");
    }
    const isParty = actor.id === agreement.buyerId || actor.id === agreement.sellerId;
    if (!isParty) throw new ForbiddenException("Not a party to this agreement");

    const role = actor.id === agreement.buyerId ? "BUYER" : "SELLER";
    const versionId = agreement.currentVersion.id;

    await this.prisma.agreementAcceptance.upsert({
      where: { versionId_userId: { versionId, userId: actor.id } },
      update: {},
      create: { versionId, userId: actor.id, role },
    });

    const acceptances = await this.prisma.agreementAcceptance.count({ where: { versionId } });
    if (acceptances >= 2 && agreement.transaction?.state === "PENDING_COUNTERPARTY_ACCEPTANCE") {
      await this.prisma.$transaction(async (db) => {
        await db.transaction.update({
          where: { id: agreement.transaction!.id },
          data: {
            state: "AWAITING_PAYMENT",
            version: { increment: 1 },
            stateHistory: {
              create: {
                fromState: "PENDING_COUNTERPARTY_ACCEPTANCE",
                toState: "AWAITING_PAYMENT",
                actorId: actor.id,
                reason: "Both parties accepted the agreed terms",
              },
            },
          },
        });
      });
    }
    return { accepted: true, bothAccepted: acceptances >= 2 };
  }
}
