import { createServer } from "node:http";
import { ZodError } from "zod";
import { creatorEvent } from "./creator_decision.js";
import { call, InfraiError, queue } from "./infrai_rest.js";
import { validSignature } from "./webhook_signature.js";

const secret = process.env.INFRAI_WEBHOOK_SECRET;
if (!secret && process.env.NODE_ENV !== "test") throw new Error("Set INFRAI_WEBHOOK_SECRET");

createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/creator-events") {
    response.writeHead(404).end(); return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks);
    if (!validSignature(raw, request.headers["x-infrai-signature"] as string | undefined, secret!)) {
      response.writeHead(401).end("Invalid signature"); return;
    }
    const event = creatorEvent.parse(JSON.parse(raw.toString("utf8")));
    await call("/v1/queue/publish", { queue, payload: event }, event.id);
    response.writeHead(202, { "Content-Type": "application/json" }).end(JSON.stringify({ queued: event.id }));
  } catch (error) {
    const status = error instanceof InfraiError && error.status >= 400 && error.status < 500 ? error.status : error instanceof SyntaxError || error instanceof ZodError ? 400 : 503;
    response.writeHead(status).end(status === 400 ? "Invalid event" : "Delivery not accepted");
  }
}).listen(Number(process.env.PORT ?? 3000));
