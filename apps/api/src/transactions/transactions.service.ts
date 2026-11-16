import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
  ConflictException,
} from "@nestjs/common";
import { assertTransition, type TransactionState } from "@escrow/core";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "../payments/payments.service";
import type { AuthUser } from "../common/decorators/current-user.decorator";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  /** All transactions where the user is buyer or seller. Real records only. */
  async listForUser(userId: string, state?: string) {
    const txs = await this.prisma.transaction.findMany({
      where: {
        agreement: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        ...(state ? { state } : {}),
      },
      include: { agreement: true },
      orderBy: { updatedAt: "desc" },
    });
    return txs.map((t) => ({
      id: t.id,
      reference: t.reference,
      state: t.state,
      title: t.agreement.title,
      amountMinor: t.agreement.amountMinor.toString(),
      currency: t.agreement.currency,
      role: t.agreement.buyerId === userId ? "BUYER" : "SELLER",
      updatedAt: t.updatedAt,
    }));
  }

  private async loadAuthorized(id: string, userId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: { agreement: true, stateHistory: { orderBy: { createdAt: "asc" } } },
    });
    if (!tx) throw new NotFoundException("Transaction not found");
    const isParty = tx.agreement.buyerId === userId || tx.agreement.sellerId === userId;
    if (!isParty) throw new ForbiddenException("Not a party to this transaction");
    return tx;
  }

  async getForUser(id: string, userId: string) {
    return this.loadAuthorized(id, userId);
  }

  /**
   * Begin funding. This NEVER marks the transaction funded — that only happens
   * on a verified provider webhook. When no provider is configured, it returns a
   * truthful 503 configuration-required rather than simulating a payment.
   */
  async requestFunding(id: string, user: AuthUser) {
    const tx = await this.loadAuthorized(id, user.id);
    if (tx.agreement.buyerId !== user.id) {
      throw new ForbiddenException("Only the buyer can fund this transaction");
    }
    if (tx.state !== "AWAITING_PAYMENT") {
      throw new ConflictException(`Transaction is not awaiting payment (state=${tx.state})`);
    }

    const caps = this.payments.capabilities();
    if (!caps.liveMoneyMovementEnabled) {
      throw new ServiceUnavailableException({
        error: "PAYMENTS_NOT_CONFIGURED",
        message:
          "Funding is unavailable: no approved payment provider or fund-safeguarding " +
          "arrangement is configured. No money has been requested or moved.",
        provider: caps.provider,
      });
    }

    // With a configured provider, a PaymentIntent would be created here and the
    // transaction moved to PAYMENT_PROCESSING. Funding -> FUNDED is driven only
    // by a verified webhook event, never by this request.
    throw new ServiceUnavailableException({
      error: "PROVIDER_FLOW_NOT_IMPLEMENTED",
      message: "A live provider adapter must be implemented before funding can proceed.",
    });
  }

  /**
   * Internal server-side transition with optimistic concurrency and history.
   * `systemTriggered` must be true for provider/ledger-driven transitions.
   */
  async transition(
    id: string,
    to: TransactionState,
    opts: { actorId?: string; systemTriggered?: boolean; reason?: string },
  ) {
    return this.prisma.$transaction(async (db) => {
      const tx = await db.transaction.findUniqueOrThrow({ where: { id } });
      const from = tx.state as TransactionState;
      assertTransition(from, to, { systemTriggered: opts.systemTriggered });

      const updated = await db.transaction.updateMany({
        where: { id, version: tx.version },
        data: { state: to, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new ConflictException("Transaction was modified concurrently; retry");
      }
      await db.transactionStateChange.create({
        data: {
          transactionId: id,
          fromState: from,
          toState: to,
          actorId: opts.actorId,
          systemDriven: opts.systemTriggered ?? false,
          reason: opts.reason,
        },
      });
      return { from, to };
    });
  }
}
