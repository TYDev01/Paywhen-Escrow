import { BadRequestException } from "@nestjs/common";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export interface UploadedFileData {
  buffer: Buffer;
}

export function detectUploadType(file?: UploadedFileData) {
  const data = file?.buffer;
  if (!data?.length) throw new BadRequestException("Choose a file to upload.");
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (data[0] === 255 && data[1] === 216 && data[2] === 255) return "image/jpeg";
  if (data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (data.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  return null;
}

export function avatarDataUrl(content?: Uint8Array) {
  return content ? `data:image/webp;base64,${Buffer.from(content).toString("base64")}` : null;
}
