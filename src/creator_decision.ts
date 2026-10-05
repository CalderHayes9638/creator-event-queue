import { z } from "zod";

export const creatorEvent = z.object({
  id: z.string().min(1),
  type: z.enum(["asset.purchased", "subscriber.updated", "content.ready"]),
  creator_id: z.string().min(1),
  subject_id: z.string().min(1)
});
export type CreatorEvent = z.infer<typeof creatorEvent>;

export function decide(event: CreatorEvent): string {
  switch (event.type) {
    case "asset.purchased": return `deliver asset ${event.subject_id} for creator ${event.creator_id}`;
    case "subscriber.updated": return `refresh subscriber ${event.subject_id} for creator ${event.creator_id}`;
    case "content.ready": return `publish processed content ${event.subject_id} for creator ${event.creator_id}`;
  }
}
