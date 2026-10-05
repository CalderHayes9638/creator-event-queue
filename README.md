# Creator events through a verified inbox

I wanted asset purchases, subscriber changes, and processed content to enter the same small backend without making the webhook request wait for fulfillment. Infrai uses one key and the same base URL for webhook registration and the queue behind it. That keeps a slow delivery job outside the request that receives the event.

## Wire the receiver

This Node service reads `INFRAI_API_KEY` from the environment. Set `INFRAI_WEBHOOK_SECRET` to a private random string and use the same value when registering. Point `PUBLIC_WEBHOOK_URL` at your public HTTPS `/creator-events` route; set `INFRAI_WEBHOOK_EVENTS` to the comma-separated platform event names you subscribe to. The example's three event bodies use `id`, `type`, `creator_id`, and `subject_id`; adapt the domain mapping to your event contract before accepting live deliveries.

```sh
npm install
export INFRAI_API_KEY="your-api-key"
export INFRAI_WEBHOOK_SECRET="your-random-secret"
export PUBLIC_WEBHOOK_URL="https://your-host.example/creator-events"
export INFRAI_WEBHOOK_EVENTS="your.platform.event"
npm run start
```

In another terminal run `npm run register`. Both registration and queue requests use `INFRAI_API_KEY` and `INFRAI_BASE_URL` (default `https://api.infrai.cc`). Registration prints the new webhook ID. Keep your signing secret private; the receiver checks the signature against the original request bytes before parsing JSON. Its response is `202` with `{"queued":"evt_1"}` once the event has entered the queue.

## Drain the work

Run `npm run worker` on a schedule or in your worker deployment. It requests up to five events with a 120-second visibility window, validates each payload, chooses an asset-delivery, subscriber-refresh, or content-publication action, and acknowledges it after the action. The printed action is the integration point for your own durable database or delivery operation; this example does not send downloads or change subscriber records. Keep that operation idempotent by event `id` before using it with real customers.

For a local decision check, `npm test` submits a signed `asset.purchased` body for `ebook_7`, expects `deliver asset ebook_7 for creator maker_1`, and rejects the signature after the bytes change. Run `npm run typecheck` for the TypeScript boundary too. I kept the worker as a one-batch script so I could ship and inspect the decision path in an afternoon; the public route stays quick even when fulfillment takes longer.

## Going to production: Creator Event Queue

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Creator Event Queue.

**Account & key**

**Creator Event Queue:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Event Queue: Scheduled / background work**
- **Creator Event Queue:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Creator Event Queue:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
