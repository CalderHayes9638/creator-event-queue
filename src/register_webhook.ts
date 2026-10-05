import { call } from "./infrai_rest.js";

const url = process.env.PUBLIC_WEBHOOK_URL;
const secret = process.env.INFRAI_WEBHOOK_SECRET;
if (!url || !secret) throw new Error("Set PUBLIC_WEBHOOK_URL and INFRAI_WEBHOOK_SECRET");
const events = (process.env.INFRAI_WEBHOOK_EVENTS ?? "").split(",").map(value => value.trim()).filter(Boolean);
if (!events.length) throw new Error("Set INFRAI_WEBHOOK_EVENTS to the platform event names to receive");
const registration = await call<{ id: string }>("/v1/account/webhooks/register", { url, events, secret }, `creator-events:${url}`);
console.log(`Registered webhook ${registration.id}`);
