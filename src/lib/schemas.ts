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
  workerSignature: z.string().min(1, "Worker signature required"),
  supervisorSignature: z.string().optional(),
});

export type FlhaSchema = z.infer<typeof flhaSchema>;
