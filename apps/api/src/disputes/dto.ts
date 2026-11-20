import { IsString, IsUUID, MinLength, MaxLength } from "class-validator";

export class OpenDisputeDto {
  @IsUUID()
  transactionId!: string;

  @IsString() @MinLength(10) @MaxLength(2000)
  reason!: string;
}

export class DisputeMessageDto {
  @IsString() @MinLength(1) @MaxLength(2000)
  body!: string;
}
