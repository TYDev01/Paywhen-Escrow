import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";

function trim(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

export class UpdateProfileDto {
  @Transform(({ value }) => trim(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName?: string;

  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalName?: string | null;

  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @Transform(({ value }) => typeof value === "string" ? value.trim().toUpperCase() : value)
  @IsOptional()
  @IsString()
  @Matches(/^(?:[A-Z]{2})?$/, { message: "Use a two-letter country code, such as NG" })
  country?: string | null;
}
