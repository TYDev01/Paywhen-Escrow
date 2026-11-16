import {
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  IsIn,
  IsEmail,
  Matches,
} from "class-validator";

export class CreateAgreementDto {
  @IsString() @MinLength(3) @MaxLength(120)
  title!: string;

  @IsString() @MinLength(10) @MaxLength(5000)
  description!: string;

  @IsString() @MaxLength(60)
  category!: string;

  /** The counterparty's email. The creator is inferred from the auth token. */
  @IsEmail()
  counterpartyEmail!: string;

  /** Is the authenticated creator the BUYER or the SELLER? */
  @IsIn(["BUYER", "SELLER"])
  creatorRole!: "BUYER" | "SELLER";

  /** Amount as a decimal string, e.g. "150.00". Parsed with currency-safe math. */
  @Matches(/^\d+(\.\d+)?$/, { message: "amount must be a decimal string" })
  amount!: string;

  @IsIn(["USD", "EUR", "GBP", "NGN", "JPY"])
  currency!: "USD" | "EUR" | "GBP" | "NGN" | "JPY";

  @IsIn(["BUYER", "SELLER", "SPLIT"])
  feePayer!: "BUYER" | "SELLER" | "SPLIT";

  @IsInt() @Min(1)
  inspectionPeriodHours!: number;

  @IsOptional() @IsString() @MaxLength(2000)
  releaseConditions?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  refundConditions?: string;

  @IsOptional() @IsString()
  deliveryDeadline?: string; // ISO date
}
