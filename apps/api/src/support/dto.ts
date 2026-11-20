import { IsString, IsIn, MinLength, MaxLength } from "class-validator";

export const SUPPORT_CATEGORIES = ["PAYMENTS", "DISPUTES", "ACCOUNT", "VERIFICATION", "OTHER"] as const;

export class CreateTicketDto {
  @IsString() @MinLength(3) @MaxLength(140)
  subject!: string;

  @IsIn(SUPPORT_CATEGORIES)
  category!: (typeof SUPPORT_CATEGORIES)[number];

  @IsString() @MinLength(10) @MaxLength(4000)
  message!: string;
}

export class TicketMessageDto {
  @IsString() @MinLength(1) @MaxLength(4000)
  body!: string;
}
