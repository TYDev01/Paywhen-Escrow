import { BadRequestException, Body, Controller, Get, Header, Patch, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import sharp from "sharp";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { UpdateProfileDto } from "./update-profile.dto";
import { avatarDataUrl, detectUploadType, MAX_AVATAR_BYTES, type UploadedFileData } from "./upload-file";
import { latestVerification, verificationStatus } from "./verification.service";

const accountInclude = {
  profile: true,
  profileAvatar: { select: { content: true } },
  verifications: { ...latestVerification, take: 1 },
} satisfies Prisma.UserInclude;

function accountResponse(record: Prisma.UserGetPayload<{ include: typeof accountInclude }>, user: AuthUser) {
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    emailVerified: record.emailVerified,
    roles: user.roles,
    permissions: user.permissions,
    profile: record.profile,
    avatarUrl: avatarDataUrl(record.profileAvatar?.content),
    verification: verificationStatus(record.verifications[0]),
  };
}

@ApiTags("users")
@ApiBearerAuth()
@Controller("me")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Header("Cache-Control", "private, no-store")
  @ApiOperation({ summary: "Current user with roles, permissions and profile" })
  async me(@CurrentUser() user: AuthUser) {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: accountInclude,
    });
    return accountResponse(record, user);
  }

  @Put("avatar")
  @Header("Cache-Control", "private, no-store")
  @ApiConsumes("multipart/form-data")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_AVATAR_BYTES, files: 1, fields: 0 } }))
  @ApiOperation({ summary: "Upload or replace the current user's profile picture" })
  async uploadAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file?: UploadedFileData) {
    if (!detectUploadType(file)?.startsWith("image/")) {
      throw new BadRequestException("Choose a JPG, PNG, or WebP image.");
    }
    const content = await sharp(file!.buffer, { limitInputPixels: 25_000_000 })
      .autoOrient()
      .resize(320, 320, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer()
      .catch(() => { throw new BadRequestException("This picture couldn’t be read. Try a different image."); });

    const avatar = await this.prisma.profileAvatar.upsert({
      where: { userId: user.id },
      create: { userId: user.id, content },
      update: { content },
      select: { content: true },
    });
    return { avatarUrl: avatarDataUrl(avatar.content) };
  }

  @Patch()
  @ApiOperation({ summary: "Update the current user's profile" })
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const profile = {
      legalName: dto.legalName === undefined ? undefined : dto.legalName || null,
      phone: dto.phone === undefined ? undefined : dto.phone || null,
      country: dto.country === undefined ? undefined : dto.country || null,
    };
    const record = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: dto.displayName,
        profile: { upsert: { create: profile, update: profile } },
      },
      select: { profile: true },
    });
    return record.profile;
  }
}
