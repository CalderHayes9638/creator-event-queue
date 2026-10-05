import { creatorEvent, decide } from "./creator_decision.js";
import { call, queue } from "./infrai_rest.js";

type Message = { message_id: string; payload: unknown };
const batch = await call<{ items: Message[] }>("/v1/queue/consume", { queue, max_messages: 5, visibility_timeout: 120 });
for (const message of batch.items) {
  const event = creatorEvent.parse(message.payload);
  // Replace this log with the durable delivery/subscriber/content write in your application.
  console.log(decide(event));
  await call("/v1/queue/ack", { queue, message_id: message.message_id }, `ack:${message.message_id}`);
}
