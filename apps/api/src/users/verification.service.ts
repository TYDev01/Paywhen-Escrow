import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IdentityDocumentType, type IdentityVerification, type Prisma, type Profile, type VerificationStatus } from "@prisma/client";
import { createCipheriv, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { detectUploadType, type UploadedFileData } from "./upload-file";

export const latestVerification = {
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
} satisfies Prisma.IdentityVerificationFindFirstArgs;

export function verificationStatus(
  record?: Pick<IdentityVerification, "status" | "expiresAt"> | null,
): VerificationStatus {
  if (record?.status === "VERIFIED" && record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
    return "EXPIRED";
  }
  return record?.status ?? "UNVERIFIED";
}

const documentMetadata = {
  select: { type: true, mimeType: true, size: true, uploadedAt: true },
} satisfies Prisma.IdentityDocumentDefaultArgs;

const verificationAccount = {
  profile: { select: { legalName: true, country: true } },
  verifications: { ...latestVerification, take: 1, include: { document: documentMetadata } },
} satisfies Prisma.UserInclude;

type VerificationRecord = Prisma.IdentityVerificationGetPayload<{ include: { document: typeof documentMetadata } }>;
type DocumentSide = { mimeType: string; bytes: Buffer };
type DocumentUpload = { type: IdentityDocumentType; front: DocumentSide; back: DocumentSide; key: Buffer };

function verificationResponse(
  profile: Pick<Profile, "legalName" | "country"> | null,
  record: VerificationRecord | undefined,
  uploadsAvailable: boolean,
) {
  const status = verificationStatus(record);
  const profileReady = Boolean(
    profile?.legalName?.trim() && /^[A-Z]{2}$/.test(profile.country?.trim().toUpperCase() ?? ""),
  );
  const canRequest = profileReady && ["UNVERIFIED", "REJECTED", "EXPIRED"].includes(status);

  return {
    status,
    profileReady,
    canRequest,
    uploadsAvailable,
    canUpload: uploadsAvailable && (canRequest || (profileReady && status === "PENDING" && !record?.document)),
    document: record?.document ?? null,
    liveVerificationAvailable: false,
    requestedAt: record?.submittedAt ?? null,
    reviewedAt: record?.reviewedAt ?? null,
    expiresAt: record?.expiresAt ?? null,
  };
}

// Encrypt one side of a document. The side is bound into the AAD so a front
// ciphertext can never be swapped in as a back (and vice versa).
function encryptSide(
  key: Buffer,
  verificationId: string,
  type: IdentityDocumentType,
  side: "front" | "back",
  data: DocumentSide,
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`${verificationId}:${type}:${side}:${data.mimeType}`));
  const encrypted = Buffer.concat([cipher.update(data.bytes), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}

// Documents must be images (no PDFs). Validated server-side, not just in the browser.
function requireImageSide(file: UploadedFileData | undefined, side: "front" | "back"): DocumentSide {
  if (!file?.buffer?.length) throw new BadRequestException(`Upload the ${side} of your document.`);
  const mimeType = detectUploadType(file);
  if (mimeType !== "image/jpeg" && mimeType !== "image/png" && mimeType !== "image/webp") {
    throw new BadRequestException(`The ${side} of your document must be a JPG, PNG, or WebP image.`);
  }
  return { mimeType, bytes: file.buffer };
}

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async status(userId: string) {
    const account = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: verificationAccount,
    });
    return verificationResponse(account.profile, account.verifications[0], Boolean(this.config.get("KYC_DOCUMENT_KEY")));
  }

  async uploadDocument(userId: string, documentType: unknown, front?: UploadedFileData, back?: UploadedFileData) {
    const key = this.config.get<string>("KYC_DOCUMENT_KEY");
    if (!key) throw new ServiceUnavailableException("Identity document uploads are unavailable.");
    if (typeof documentType !== "string" || !Object.values(IdentityDocumentType).some((type) => type === documentType)) {
      throw new BadRequestException("Select a valid document type.");
    }
    return this.request(userId, {
      type: documentType as IdentityDocumentType,
      front: requireImageSide(front, "front"),
      back: requireImageSide(back, "back"),
      key: Buffer.from(key, "base64"),
    });
  }

  async request(userId: string, upload?: DocumentUpload) {
    return this.prisma.$transaction(async (db) => {
      // Serialize submissions so retries cannot create a second pending request or document.
      await db.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const account = await db.user.findUniqueOrThrow({
        where: { id: userId },
        include: verificationAccount,
      });
      const existing = account.verifications[0];
      const available = Boolean(this.config.get("KYC_DOCUMENT_KEY"));
      const current = verificationResponse(account.profile, existing, available);
      if (!upload && ["PENDING", "IN_REVIEW", "VERIFIED"].includes(current.status)) return current;
      if (!current.profileReady) {
        throw new ConflictException("Add your legal name and country to your profile before requesting verification.");
      }
      if (upload && !current.canUpload) {
        throw new ConflictException("A document is already on file or this request cannot accept uploads.");
      }

      const record = current.status === "PENDING" && existing
        ? existing
        : await db.identityVerification.create({
            data: { userId, provider: "none", status: "PENDING", submittedAt: new Date() },
            include: { document: documentMetadata },
          });
      if (record.id !== existing?.id) {
        await db.auditLog.create({
          data: { actorId: userId, entityType: "IdentityVerification", entityId: record.id, action: "identity_verification.requested" },
        });
      }

      if (upload) {
        record.document = await db.identityDocument.create({
          data: {
            verificationId: record.id,
            type: upload.type,
            mimeType: upload.front.mimeType,
            size: upload.front.bytes.length,
            encrypted: encryptSide(upload.key, record.id, upload.type, "front", upload.front),
            backMimeType: upload.back.mimeType,
            backSize: upload.back.bytes.length,
            encryptedBack: encryptSide(upload.key, record.id, upload.type, "back", upload.back),
          },
          ...documentMetadata,
        });
        await db.auditLog.create({
          data: { actorId: userId, entityType: "IdentityVerification", entityId: record.id, action: "identity_verification.document_uploaded" },
        });
      }
      return verificationResponse(account.profile, record, available);
    });
  }
}
