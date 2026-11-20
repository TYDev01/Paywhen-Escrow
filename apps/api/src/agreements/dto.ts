import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  MinLength,
  MaxLength,
  Min,
  IsIn,
  IsEmail,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

export class MilestoneInputDto {
  @IsString() @MinLength(2) @MaxLength(120)
  title!: string;

  @Matches(/^\d+(\.\d+)?$/, { message: "milestone amount must be a decimal string" })
  amount!: string;
}

export class AgreementImageDto {
  @IsString() @MaxLength(260)
  fileName!: string;

  @IsString() @MaxLength(100)
  contentType!: string;

  @IsInt() @Min(0)
  sizeBytes!: number;
}

export class CreateAgreementDto {
  @IsString() @MinLength(3) @MaxLength(120)
  title!: string;

  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @IsString() @MaxLength(60)
  category!: string;

  /**
   * The counterparty's email. Optional: when omitted the escrow is "open" — the
   * creator is the seller and a buyer attaches later by paying the reference.
   */
  @IsOptional() @IsEmail()
  counterpartyEmail?: string;

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

  /** SINGLE = one payment; MILESTONES = released in stages. */
  @IsOptional() @IsIn(["SINGLE", "MILESTONES"])
  payoutType?: "SINGLE" | "MILESTONES";

  /** Required when payoutType is MILESTONES; amounts must sum to `amount`. */
  @IsOptional() @IsArray() @ArrayMaxSize(20)
  @ValidateNested({ each: true }) @Type(() => MilestoneInputDto)
  milestones?: MilestoneInputDto[];

  /** Metadata for supporting images (bytes are not persisted without storage). */
  @IsOptional() @IsArray() @ArrayMaxSize(5)
  @ValidateNested({ each: true }) @Type(() => AgreementImageDto)
  images?: AgreementImageDto[];

  @IsOptional() @IsString() @MaxLength(2000)
  releaseConditions?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  refundConditions?: string;

  @IsOptional() @IsString()
  deliveryDeadline?: string; // ISO date
}
