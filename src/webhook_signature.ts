import { createHmac, timingSafeEqual } from "node:crypto";

export function validSignature(raw: Buffer, signature: string | undefined, secret: string): boolean {
  const supplied = signature?.replace(/^sha256=/, "");
  if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(supplied, "hex"));
}
