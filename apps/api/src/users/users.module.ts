import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  controllers: [UsersController, VerificationController],
  providers: [VerificationService],
})
export class UsersModule {}
