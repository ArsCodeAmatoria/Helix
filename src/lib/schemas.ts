import { z } from "zod";

export const flhaSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  role: z.string().min(1, "Select a role"),
  taskIds: z.array(z.string()).min(1, "Select at least one task"),
  confirmedHazardIds: z.array(z.string()),
  additionalHazardsEnabled: z.boolean().nullable(),
  reviewedDocuments: z.array(z.string()),
  environment: z.array(z.string()),
  comments: z.string().optional(),
  signers: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        signature: z.string().min(1),
      })
    )
    .min(1, "At least one signature required"),
});

export type FlhaSchema = z.infer<typeof flhaSchema>;
