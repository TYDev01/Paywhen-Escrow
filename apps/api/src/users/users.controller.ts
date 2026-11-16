import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(80)
  displayName?: string;

  @IsOptional() @IsString() @MaxLength(120)
  legalName?: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(2)
  country?: string;
}

@ApiTags("users")
@ApiBearerAuth()
@Controller("me")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Current user with roles, permissions and profile" })
  async me(@CurrentUser() user: AuthUser) {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true, verifications: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return {
      id: record.id,
      email: record.email,
      displayName: record.displayName,
      emailVerified: record.emailVerified,
      roles: user.roles,
      permissions: user.permissions,
      profile: record.profile,
      verification: record.verifications[0]?.status ?? "UNVERIFIED",
    };
  }

  @Patch()
  @ApiOperation({ summary: "Update profile" })
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    if (dto.displayName) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { displayName: dto.displayName },
      });
    }
    const profile = await this.prisma.profile.update({
      where: { userId: user.id },
      data: {
        legalName: dto.legalName,
        phone: dto.phone,
        country: dto.country,
      },
    });
    return profile;
  }
}
