import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { generateReference } from "../common/reference";
import type { CreateTicketDto, TicketMessageDto } from "./dto";

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return tickets.map((t) => ({
      id: t.id,
      reference: t.reference,
      subject: t.subject,
      category: t.category,
      status: t.status,
      messageCount: t._count.messages,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  async getForUser(id: string, userId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { displayName: true } } },
        },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return {
      id: ticket.id,
      reference: ticket.reference,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages.map((m) => ({
        id: m.id,
        body: m.body,
        authorName: m.author.displayName,
        fromSupport: m.fromSupport,
        createdAt: m.createdAt,
      })),
    };
  }

  async create(userId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        reference: generateReference("TCK"),
        userId,
        subject: dto.subject,
        category: dto.category,
        messages: { create: { authorId: userId, body: dto.message } },
      },
    });
    return this.getForUser(ticket.id, userId);
  }

  async reply(id: string, userId: string, dto: TicketMessageDto) {
    const ticket = await this.prisma.supportTicket.findFirst({ where: { id, userId } });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (ticket.status === "CLOSED") throw new ConflictException("This ticket is closed");
    await this.prisma.$transaction([
      this.prisma.supportTicketMessage.create({ data: { ticketId: id, authorId: userId, body: dto.body } }),
      // A new owner reply reopens a resolved ticket and bumps the sort order.
      this.prisma.supportTicket.update({
        where: { id },
        data: { status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status, updatedAt: new Date() },
      }),
    ]);
    return this.getForUser(id, userId);
  }
}
