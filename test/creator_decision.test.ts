import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { creatorEvent, decide } from "../src/creator_decision.js";
import { validSignature } from "../src/webhook_signature.js";

test("purchase routes to asset delivery only after authenticating the exact bytes", () => {
  const raw = Buffer.from('{"id":"evt_1","type":"asset.purchased","creator_id":"maker_1","subject_id":"ebook_7"}');
  const signature = createHmac("sha256", "test-secret").update(raw).digest("hex");
  assert.equal(validSignature(raw, signature, "test-secret"), true);
  assert.equal(validSignature(Buffer.from(raw.toString().replace("ebook_7", "ebook_8")), signature, "test-secret"), false);
  assert.equal(decide(creatorEvent.parse(JSON.parse(raw.toString()))), "deliver asset ebook_7 for creator maker_1");
});
