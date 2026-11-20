import { Body, Controller, Get, Header, HttpCode, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { VerificationService } from "./verification.service";
import { MAX_DOCUMENT_BYTES, type UploadedFileData } from "./upload-file";

@ApiTags("identity verification")
@ApiBearerAuth()
@Controller("me/verification")
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  @Header("Cache-Control", "private, no-store")
  @ApiOperation({ summary: "Read the caller’s identity verification status" })
  status(@CurrentUser() user: AuthUser) {
    return this.verification.status(user.id);
  }

  @Post("document")
  @Header("Cache-Control", "private, no-store")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: "front", maxCount: 1 }, { name: "back", maxCount: 1 }], {
      limits: { fileSize: MAX_DOCUMENT_BYTES, files: 2, fields: 1 },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Submit both sides of an identity document for the caller" })
  document(
    @CurrentUser() user: AuthUser,
    @Body("documentType") type: unknown,
    @UploadedFiles() files?: { front?: UploadedFileData[]; back?: UploadedFileData[] },
  ) {
    return this.verification.uploadDocument(user.id, type, files?.front?.[0], files?.back?.[0]);
  }

  @Post("request")
  @HttpCode(200)
  @ApiOperation({ summary: "Record an identity verification request for the caller" })
  request(@CurrentUser() user: AuthUser) {
    return this.verification.request(user.id);
  }
}
