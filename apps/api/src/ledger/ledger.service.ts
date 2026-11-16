import { Injectable, ConflictException } from "@nestjs/common";
import { assertBalanced, signedEffect, type AccountType, type Posting } from "@escrow/core";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

export interface PostEntryInput {
  reference: string;
  idempotencyKey: string;
  transactionId?: string;
  postings: Array<{
    accountCode: string;
    accountType: AccountType;
    direction: "DEBIT" | "CREDIT";
    amountMinor: bigint;
    currency: string;
  }>;
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Post a balanced, idempotent journal entry. Re-posting the same
   * idempotencyKey is a no-op (returns the existing entry id). Account balances
   * are never stored — they are derived from postings via {@link balanceFor}.
   */
  async postEntry(input: PostEntryInput, tx?: Prisma.TransactionClient): Promise<string> {
    const db = tx ?? this.prisma;

    // In-memory balance check before touching the DB.
    const corePostings: Posting[] = input.postings.map((p) => ({
      accountId: p.accountCode,
      direction: p.direction,
      amount: p.amountMinor,
      currency: p.currency as Posting["currency"],
    }));
    assertBalanced({
      postings: corePostings,
      reference: input.reference,
      idempotencyKey: input.idempotencyKey,
    });

    const existing = await db.journalEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing.id;

    // Ensure all accounts exist.
    for (const p of input.postings) {
      await db.ledgerAccount.upsert({
        where: { code: p.accountCode },
        update: {},
        create: { code: p.accountCode, type: p.accountType, currency: p.currency },
      });
    }

    try {
      const entry = await db.journalEntry.create({
        data: {
          reference: input.reference,
          idempotencyKey: input.idempotencyKey,
          transactionId: input.transactionId,
          postings: {
            create: await Promise.all(
              input.postings.map(async (p) => {
                const account = await db.ledgerAccount.findUniqueOrThrow({
                  where: { code: p.accountCode },
                });
                return {
                  accountId: account.id,
                  direction: p.direction,
                  amountMinor: p.amountMinor,
                  currency: p.currency,
                };
              }),
            ),
          },
        },
      });
      return entry.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Concurrent post with the same idempotency key — treat as success.
        const e = await db.journalEntry.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (e) return e.id;
      }
      throw new ConflictException("Failed to post ledger entry");
    }
  }

  /** Derive an account balance (signed minor units) from its postings. */
  async balanceFor(accountCode: string): Promise<bigint> {
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { code: accountCode },
      include: { postings: true },
    });
    if (!account) return 0n;
    return account.postings.reduce(
      (sum, p) =>
        sum +
        signedEffect(account.type as AccountType, {
          accountId: account.id,
          direction: p.direction as "DEBIT" | "CREDIT",
          amount: p.amountMinor,
          currency: p.currency as Posting["currency"],
        }),
      0n,
    );
  }
}
