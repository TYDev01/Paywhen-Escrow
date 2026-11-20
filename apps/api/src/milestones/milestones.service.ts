import { Injectable, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import type { MilestoneStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Advance a milestone one step: PENDING -> DELIVERED (seller marks it done),
   * DELIVERED -> RELEASED (buyer confirms). Structural only — no money moves.
   */
  async advance(id: string, userId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { agreement: true },
    });
    if (!milestone) throw new NotFoundException("Milestone not found");

    const isSeller = milestone.agreement.sellerId === userId;
    const isBuyer = milestone.agreement.buyerId === userId;
    if (!isSeller && !isBuyer) throw new ForbiddenException("Not a party to this escrow");

    let next: MilestoneStatus;
    if (milestone.status === "PENDING") {
      if (!isSeller) throw new ForbiddenException("Only the seller can mark a milestone delivered");
      next = "DELIVERED";
    } else if (milestone.status === "DELIVERED") {
      if (!isBuyer) throw new ForbiddenException("Only the buyer can release a milestone");
      next = "RELEASED";
    } else {
      throw new ConflictException(`Milestone is ${milestone.status.toLowerCase()} and can’t be advanced`);
    }

    const updated = await this.prisma.milestone.update({ where: { id }, data: { status: next } });
    await this.prisma.auditLog.create({
      data: { actorId: userId, entityType: "Milestone", entityId: id, action: `milestone.${next.toLowerCase()}` },
    });
    return { id: updated.id, status: updated.status };
  }
}
