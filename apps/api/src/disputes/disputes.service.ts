import { Injectable, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { OpenDisputeDto, DisputeMessageDto } from "./dto";

// A dispute is visible to both parties of the underlying transaction.
const partyWhere = (userId: string) => ({
  transaction: { agreement: { OR: [{ buyerId: userId }, { sellerId: userId }] } },
});

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const disputes = await this.prisma.dispute.findMany({
      where: partyWhere(userId),
      include: {
        transaction: { include: { agreement: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return disputes.map((d) => this.summary(d, userId));
  }

  async getForUser(id: string, userId: string) {
    const dispute = await this.prisma.dispute.findFirst({
      where: { id, ...partyWhere(userId) },
      include: {
        transaction: { include: { agreement: true } },
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, displayName: true } } },
        },
        decision: true,
      },
    });
    if (!dispute) throw new NotFoundException("Dispute not found");
    return {
      ...this.summary(dispute, userId),
      messages: dispute.messages.map((m) => ({
        id: m.id,
        body: m.body,
        authorName: m.author.displayName,
        mine: m.authorId === userId,
        createdAt: m.createdAt,
      })),
      decision: dispute.decision
        ? { outcome: dispute.decision.outcome, rationale: dispute.decision.rationale, createdAt: dispute.decision.createdAt }
        : null,
    };
  }

  async open(userId: string, dto: OpenDisputeDto) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      include: { agreement: true, disputes: { where: { status: { in: ["OPEN", "IN_REVIEW", "APPEALED"] } } } },
    });
    if (!tx) throw new NotFoundException("Transaction not found");
    const isParty = tx.agreement.buyerId === userId || tx.agreement.sellerId === userId;
    if (!isParty) throw new ForbiddenException("Not a party to this transaction");
    if (tx.disputes.length > 0) {
      throw new ConflictException("This transaction already has an open dispute");
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        transactionId: tx.id,
        openedById: userId,
        reason: dto.reason,
        messages: { create: { authorId: userId, body: dto.reason } },
      },
    });
    await this.prisma.auditLog.create({
      data: { actorId: userId, entityType: "Dispute", entityId: dispute.id, action: "dispute.opened" },
    });
    return this.getForUser(dispute.id, userId);
  }

  async addMessage(id: string, userId: string, dto: DisputeMessageDto) {
    const dispute = await this.prisma.dispute.findFirst({ where: { id, ...partyWhere(userId) } });
    if (!dispute) throw new NotFoundException("Dispute not found");
    if (["RESOLVED", "CLOSED"].includes(dispute.status)) {
      throw new ConflictException("This dispute is closed to new messages");
    }
    await this.prisma.$transaction([
      this.prisma.disputeMessage.create({ data: { disputeId: id, authorId: userId, body: dto.body } }),
      this.prisma.dispute.update({ where: { id }, data: { updatedAt: new Date() } }),
    ]);
    return this.getForUser(id, userId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private summary(d: any, userId: string) {
    return {
      id: d.id,
      status: d.status,
      reason: d.reason,
      transactionId: d.transactionId,
      transactionReference: d.transaction.reference,
      title: d.transaction.agreement.title,
      amountMinor: d.transaction.agreement.amountMinor.toString(),
      currency: d.transaction.agreement.currency,
      role: d.transaction.agreement.buyerId === userId ? "BUYER" : "SELLER",
      openedByMe: d.openedById === userId,
      messageCount: d._count?.messages ?? 0,
      responseDueAt: d.responseDueAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}
